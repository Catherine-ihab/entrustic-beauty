import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { Device } from './entities/device.entity';

const CLINIC_A_ID = 'clinic-a-uuid-0001';
const CLINIC_B_ID = 'clinic-b-uuid-0002';
const DEVICE_ID = 'device-uuid-1111';

describe('DevicesService — Multi-Tenant Isolation', () => {
  let service: DevicesService;

  const deviceRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: getRepositoryToken(Device),
          useValue: deviceRepoMock,
        },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    jest.clearAllMocks();
  });

  it('findAll scopes query strictly to clinic_id', async () => {
    deviceRepoMock.find.mockResolvedValue([]);

    await service.findAll(CLINIC_A_ID);

    expect(deviceRepoMock.find).toHaveBeenCalledWith({
      where: { clinic_id: CLINIC_A_ID },
      order: { created_at: 'DESC' },
    });
  });

  it('findOne rejects with NotFoundException if device belongs to another clinic', async () => {
    deviceRepoMock.findOne.mockResolvedValue(null);

    await expect(service.findOne(CLINIC_B_ID, DEVICE_ID)).rejects.toThrow(
      NotFoundException,
    );

    expect(deviceRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: DEVICE_ID, clinic_id: CLINIC_B_ID },
    });
  });

  it('create attaches clinic_id firmly to the new device', async () => {
    const mockDevice = { id: 'new-dev', name: 'Candela GentleMax Pro' };
    deviceRepoMock.create.mockReturnValue(mockDevice);
    deviceRepoMock.save.mockResolvedValue(mockDevice);

    await service.create(CLINIC_A_ID, {
      name: 'Candela GentleMax Pro',
      device_type: 'laser',
    });

    expect(deviceRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clinic_id: CLINIC_A_ID,
        name: 'Candela GentleMax Pro',
      }),
    );
  });
});
