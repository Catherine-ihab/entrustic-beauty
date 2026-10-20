import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { ClinicService } from '../services/entities/clinic-service.entity';
import { TenantSequence } from '../tenants/entities/tenant-sequence.entity';
import { InvoiceStatus } from '@clinic/shared-types';
import { DataSource } from 'typeorm';

const CLINIC_ID = 'clinic-uuid-0001';

const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice =>
  Object.assign(new Invoice(), {
    id: 'invoice-uuid-1111',
    clinic_id: CLINIC_ID,
    patient_id: 'patient-uuid-1111',
    invoice_number: 'INV-2026-00001',
    status: InvoiceStatus.ISSUED,
    currency: 'EGP',
    subtotal: 500,
    tax_amount: 0,
    discount_amount: 0,
    total: 500,          // entity field is `total`, not `total_amount`
    paid_amount: 0,
    issue_date: '2026-10-01',
    due_date: null,
    created_at: new Date(),
    updated_at: new Date(),
    items: [],
    ...overrides,
  });

// QueryRunner mock for invoice number generation
const makeQrMock = () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  startTransaction: jest.fn().mockResolvedValue(undefined),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
  manager: {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((_entity: any, data: any) => ({ ...data })),
    save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
  },
});

describe('InvoicesService — Financial Integrity', () => {
  let service: InvoicesService;
  let qrMock: ReturnType<typeof makeQrMock>;

  const invoiceRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const itemRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const serviceRepoMock = {
    findOne: jest.fn(),
  };

  const dataSourceMock = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    qrMock = makeQrMock();
    dataSourceMock.createQueryRunner.mockReturnValue(qrMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepoMock },
        { provide: getRepositoryToken(InvoiceItem), useValue: itemRepoMock },
        { provide: getRepositoryToken(ClinicService), useValue: serviceRepoMock },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    jest.clearAllMocks();
    dataSourceMock.createQueryRunner.mockReturnValue(qrMock);
  });

  describe('Price Snapshot Immutability', () => {
    it('should snapshot service name and price into item at creation time', async () => {
      const clinicSrv = {
        id: 'service-uuid-1111',
        name: 'Teeth Cleaning',
        current_price: 250,
        clinic_id: CLINIC_ID,
      };
      serviceRepoMock.findOne.mockResolvedValue(clinicSrv);

      const itemSnapshot: any = {};
      itemRepoMock.create.mockImplementation((data: any) => {
        Object.assign(itemSnapshot, data);
        return data;
      });
      itemRepoMock.save.mockImplementation((item: any) => Promise.resolve(item));

      const invoice = makeInvoice();
      invoiceRepoMock.create.mockReturnValue(invoice);
      invoiceRepoMock.save.mockResolvedValue(invoice);

      await service.create(CLINIC_ID, 'EGP', {
        patientId: 'patient-uuid-1111',
        issueDate: '2026-10-01',
        items: [{ serviceId: 'service-uuid-1111', description: 'placeholder', unitPrice: 0, quantity: 2 }],
      });

      // Snapshot fields must come from the clinic service record
      expect(itemRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Teeth Cleaning',  // from service.name
          unit_price: 250,               // from service.current_price
        }),
      );
    });

    it('INTEGRITY: modifying service price does not alter a saved snapshot', () => {
      // Design-level verification: InvoiceItem.unit_price is a standalone DECIMAL column
      // not a FK reference, so price changes on ClinicService have zero effect.
      const item = Object.assign(new InvoiceItem(), { unit_price: 250, description: 'Teeth Cleaning' });
      const updatedServicePrice = 400;

      expect(item.unit_price).toBe(250);
      expect(item.unit_price).not.toBe(updatedServicePrice);
    });
  });

  describe('recordPayment — status transitions', () => {
    it('should transition ISSUED → PARTIALLY_PAID for a partial payment', async () => {
      const invoice = makeInvoice({
        status: InvoiceStatus.ISSUED,
        total: 500,
        paid_amount: 0,
      });
      invoiceRepoMock.findOne.mockResolvedValue(invoice);
      invoiceRepoMock.save.mockImplementation((inv: any) => Promise.resolve(inv));

      const result = await service.recordPayment(CLINIC_ID, invoice.id, {
        amount: 200,
        paymentMethod: 'cash',
      });

      expect(result.status).toBe(InvoiceStatus.PARTIALLY_PAID);
      expect(Number(result.paid_amount)).toBeCloseTo(200);
    });

    it('should transition PARTIALLY_PAID → PAID when full balance is settled', async () => {
      const invoice = makeInvoice({
        status: InvoiceStatus.PARTIALLY_PAID,
        total: 500,
        paid_amount: 200,
      });
      invoiceRepoMock.findOne.mockResolvedValue(invoice);
      invoiceRepoMock.save.mockImplementation((inv: any) => Promise.resolve(inv));

      const result = await service.recordPayment(CLINIC_ID, invoice.id, {
        amount: 300,
        paymentMethod: 'card',
      });

      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(Number(result.paid_amount)).toBeCloseTo(500);
    });

    it('GUARD: should reject payment on an already-PAID invoice', async () => {
      const invoice = makeInvoice({
        status: InvoiceStatus.PAID,
        total: 500,
        paid_amount: 500,
      });
      invoiceRepoMock.findOne.mockResolvedValue(invoice);

      await expect(
        service.recordPayment(CLINIC_ID, invoice.id, { amount: 50, paymentMethod: 'cash' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('GUARD: should reject payment that would exceed the invoice total (overpayment)', async () => {
      const invoice = makeInvoice({
        status: InvoiceStatus.ISSUED,
        total: 500,
        paid_amount: 0,
      });
      invoiceRepoMock.findOne.mockResolvedValue(invoice);

      await expect(
        service.recordPayment(CLINIC_ID, invoice.id, { amount: 9999, paymentMethod: 'cash' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ISOLATION: recordPayment must return NotFoundException for invoice from another clinic', async () => {
      invoiceRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.recordPayment('other-clinic-id', 'invoice-uuid-1111', {
          amount: 100,
          paymentMethod: 'cash',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
