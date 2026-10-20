import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus } from './entities/device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  async findAll(clinicId: string): Promise<Device[]> {
    return this.deviceRepo.find({
      where: { clinic_id: clinicId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<Device> {
    const device = await this.deviceRepo.findOne({
      where: { id, clinic_id: clinicId },
    });

    if (!device) {
      throw new NotFoundException('Medical device not found');
    }

    return device;
  }

  async create(clinicId: string, dto: any): Promise<Device> {
    const device = this.deviceRepo.create({
      ...dto,
      clinic_id: clinicId,
      status: dto.status || 'active',
    } as any);

    return this.deviceRepo.save(device as any);
  }

  async update(clinicId: string, id: string, dto: any): Promise<Device> {
    const device = await this.findOne(clinicId, id);
    Object.assign(device, dto);
    return this.deviceRepo.save(device);
  }

  async setStatus(clinicId: string, id: string, status: DeviceStatus): Promise<Device> {
    const device = await this.findOne(clinicId, id);
    device.status = status;
    return this.deviceRepo.save(device);
  }

  async delete(clinicId: string, id: string): Promise<void> {
    const device = await this.findOne(clinicId, id);
    await this.deviceRepo.remove(device);
  }
}
