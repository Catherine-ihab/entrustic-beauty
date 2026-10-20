import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { ClinicService } from '../services/entities/clinic-service.entity';
import { TenantSequence } from '../tenants/entities/tenant-sequence.entity';
import { SequenceType, CreateInvoiceDto, InvoiceStatus, RecordPaymentDto } from '@clinic/shared-types';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly itemRepo: Repository<InvoiceItem>,
    @InjectRepository(ClinicService)
    private readonly serviceRepo: Repository<ClinicService>,
    private readonly dataSource: DataSource,
  ) {}

  private async generateInvoiceNumber(clinicId: string): Promise<string> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;

      let seq = await qr.manager.findOne(TenantSequence, {
        where: { clinic_id: clinicId, sequence_type: SequenceType.INVOICE },
        lock: { mode: 'pessimistic_write' },
      });

      if (!seq) {
        seq = qr.manager.create(TenantSequence, {
          clinic_id: clinicId,
          sequence_type: SequenceType.INVOICE,
          current_value: '1',
          prefix,
        });
        await qr.manager.save(seq);
        await qr.commitTransaction();
        return `${prefix}${String(1).padStart(5, '0')}`;
      }

      const nextVal = BigInt(seq.current_value) + BigInt(1);
      seq.current_value = nextVal.toString();
      await qr.manager.save(seq);
      await qr.commitTransaction();

      return `${prefix}${String(nextVal).padStart(5, '0')}`;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async create(clinicId: string, currency: string, dto: CreateInvoiceDto): Promise<Invoice> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Invoice must contain at least one line item.');
    }

    const invoiceNumber = await this.generateInvoiceNumber(clinicId);

    let subtotal = 0;
    const itemsToCreate: InvoiceItem[] = [];

    for (const itemDto of dto.items) {
      let unitPrice = itemDto.unitPrice;
      let description = itemDto.description;

      // If tied to a service, snapshot active price and name
      if (itemDto.serviceId) {
        const srv = await this.serviceRepo.findOne({
          where: { id: itemDto.serviceId, clinic_id: clinicId },
        });
        if (srv) {
          unitPrice = Number(srv.current_price);
          description = srv.name;
        }
      }

      const lineTotal = Number(unitPrice) * Number(itemDto.quantity);
      subtotal += lineTotal;

      const item = this.itemRepo.create({
        clinic_id: clinicId,
        service_id: itemDto.serviceId || null,
        description,
        unit_price: unitPrice,
        quantity: itemDto.quantity,
        line_total: lineTotal,
      });

      itemsToCreate.push(item);
    }

    const discount = Number(dto.discountAmount || 0);
    const tax = Number(dto.taxAmount || 0);
    const total = Math.max(0, subtotal - discount + tax);

    const invoice = this.invoiceRepo.create({
      clinic_id: clinicId,
      patient_id: dto.patientId,
      invoice_number: invoiceNumber,
      currency,
      issue_date: dto.issueDate,
      due_date: dto.dueDate || null,
      subtotal,
      discount_amount: discount,
      tax_amount: tax,
      total,
      paid_amount: 0,
      status: InvoiceStatus.ISSUED,
      items: itemsToCreate,
    });

    return this.invoiceRepo.save(invoice);
  }

  async recordPayment(
    clinicId: string,
    invoiceId: string,
    dto: RecordPaymentDto,
  ): Promise<Invoice> {
    const invoice = await this.findOne(clinicId, invoiceId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('This invoice has already been paid in full.');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot record payment on a cancelled invoice.');
    }

    const remaining = Number(invoice.total) - Number(invoice.paid_amount);
    if (Number(dto.amount) > remaining) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds the remaining balance (${remaining.toFixed(2)}).`,
      );
    }

    const newPaid = Number(invoice.paid_amount) + Number(dto.amount);
    invoice.paid_amount = newPaid;

    if (newPaid >= Number(invoice.total)) {
      invoice.status = InvoiceStatus.PAID;
    } else if (newPaid > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    return this.invoiceRepo.save(invoice);
  }

  async findAll(clinicId: string, patientId?: string): Promise<Invoice[]> {
    const where: any = { clinic_id: clinicId };
    if (patientId) {
      where.patient_id = patientId;
    }

    return this.invoiceRepo.find({
      where,
      relations: ['patient', 'items'],
      order: { issue_date: 'DESC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, clinic_id: clinicId },
      relations: ['patient', 'items'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }
}
