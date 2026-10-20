import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicService } from './entities/clinic-service.entity';
import { CreateClinicServiceDto, UpdateClinicServiceDto } from '@clinic/shared-types';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ClinicService)
    private readonly serviceRepo: Repository<ClinicService>,
  ) {}

  async create(clinicId: string, dto: CreateClinicServiceDto): Promise<ClinicService> {
    const service = this.serviceRepo.create({
      ...dto,
      clinic_id: clinicId,
    });
    return this.serviceRepo.save(service);
  }

  async findAll(clinicId: string, activeOnly: boolean = false): Promise<ClinicService[]> {
    const where: any = { clinic_id: clinicId };
    if (activeOnly) {
      where.is_active = true;
    }
    return this.serviceRepo.find({
      where,
      order: { sort_order: 'ASC', name: 'ASC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<ClinicService> {
    const service = await this.serviceRepo.findOne({
      where: { id, clinic_id: clinicId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async update(clinicId: string, id: string, dto: UpdateClinicServiceDto): Promise<ClinicService> {
    const service = await this.findOne(clinicId, id);
    Object.assign(service, dto);
    return this.serviceRepo.save(service);
  }

  async deactivate(clinicId: string, id: string): Promise<ClinicService> {
    const service = await this.findOne(clinicId, id);
    service.is_active = false;
    return this.serviceRepo.save(service);
  }
}
