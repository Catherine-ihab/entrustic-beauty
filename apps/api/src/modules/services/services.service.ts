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
    // Entity columns are snake_case while the DTO is camelCase — spreading the
    // DTO left `current_price` NULL on a NOT NULL column, so creating a service
    // always failed with a 500.
    const service = this.serviceRepo.create({
      clinic_id: clinicId,
      category_id: dto.categoryId ?? null,
      name: dto.name,
      description: dto.description ?? null,
      default_duration_minutes: dto.defaultDurationMinutes ?? 30,
      current_price: dto.currentPrice,
      sort_order: dto.sortOrder ?? 0,
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

    // Same camelCase → snake_case mapping as `create`; only touch columns the
    // caller actually sent.
    const mapping: Array<[keyof UpdateClinicServiceDto, keyof ClinicService]> = [
      ['categoryId', 'category_id'],
      ['name', 'name'],
      ['description', 'description'],
      ['defaultDurationMinutes', 'default_duration_minutes'],
      ['currentPrice', 'current_price'],
      ['isActive', 'is_active'],
      ['sortOrder', 'sort_order'],
    ];

    for (const [dtoKey, column] of mapping) {
      const value = dto[dtoKey];
      if (value !== undefined) {
        (service as unknown as Record<string, unknown>)[column] = value;
      }
    }

    return this.serviceRepo.save(service);
  }

  async deactivate(clinicId: string, id: string): Promise<ClinicService> {
    const service = await this.findOne(clinicId, id);
    service.is_active = false;
    return this.serviceRepo.save(service);
  }
}
