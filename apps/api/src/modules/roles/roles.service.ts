import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

export interface CreateRoleDto {
  name: string;
  displayName: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleDto {
  displayName?: string;
  description?: string;
  permissionIds?: string[];
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
  ) {}

  async findAll(clinicId: string): Promise<Role[]> {
    return this.roleRepo.find({
      where: [{ clinic_id: clinicId }, { is_system: true, clinic_id: null }],
      relations: ['permissions'],
      order: { is_system: 'DESC', name: 'ASC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: [
        { id, clinic_id: clinicId },
        { id, is_system: true },
      ],
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permRepo.find({
      order: { module_key: 'ASC', resource: 'ASC', action: 'ASC' },
    });
  }

  async create(clinicId: string, dto: CreateRoleDto): Promise<Role> {
    const cleanName = dto.name.toLowerCase().trim().replace(/\s+/g, '_');

    const existing = await this.roleRepo.findOne({
      where: { clinic_id: clinicId, name: cleanName },
    });
    if (existing) {
      throw new ConflictException(`Role '${cleanName}' already exists in this clinic.`);
    }

    let permissions: Permission[] = [];
    if (dto.permissionIds && dto.permissionIds.length > 0) {
      permissions = await this.permRepo.findBy({ id: In(dto.permissionIds) });
    }

    const role = this.roleRepo.create({
      clinic_id: clinicId,
      name: cleanName,
      display_name: dto.displayName || dto.name,
      description: dto.description || null,
      is_system: false,
      permissions,
    });

    return this.roleRepo.save(role);
  }

  async update(clinicId: string, id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(clinicId, id);

    if (role.is_system) {
      throw new BadRequestException('System-defined default roles cannot be modified.');
    }

    if (dto.displayName !== undefined) role.display_name = dto.displayName;
    if (dto.description !== undefined) role.description = dto.description;

    if (dto.permissionIds !== undefined) {
      role.permissions = await this.permRepo.findBy({ id: In(dto.permissionIds) });
    }

    return this.roleRepo.save(role);
  }

  async delete(clinicId: string, id: string): Promise<{ deleted: boolean }> {
    const role = await this.findOne(clinicId, id);

    if (role.is_system) {
      throw new BadRequestException('System-defined default roles cannot be deleted.');
    }

    await this.roleRepo.remove(role);
    return { deleted: true };
  }
}
