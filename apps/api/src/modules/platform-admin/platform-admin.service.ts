import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Clinic } from '../tenants/entities/clinic.entity';
import { ClinicBranding } from '../tenants/entities/clinic-branding.entity';
import { ClinicModule as ClinicModuleEntity } from '../tenants/entities/clinic-module.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../roles/entities/permission.entity';
import * as argon2 from 'argon2';
import {
  CreateClinicDto,
  UpdateClinicPlatformDto,
  IPlatformClinicSummary,
  ClinicStatus,
  ClinicType,
  UserStatus,
} from '@clinic/shared-types';

@Injectable()
export class PlatformAdminService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepo: Repository<Clinic>,
    @InjectRepository(ClinicBranding)
    private readonly brandingRepo: Repository<ClinicBranding>,
    @InjectRepository(ClinicModuleEntity)
    private readonly moduleRepo: Repository<ClinicModuleEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    private readonly dataSource: DataSource,
  ) {}

  private assertValidSlug(slug: string): void {
    const slugRegex = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/;
    if (!slugRegex.test(slug)) {
      throw new BadRequestException(
        'Clinic subdomain must be lowercase alphanumeric with hyphens, 3-48 characters.',
      );
    }

    const reservedSlugs = [
      'admin',
      'api',
      'app',
      'auth',
      'billing',
      'cdn',
      'dev',
      'mail',
      'portal',
      'staging',
      'status',
      'support',
      'test',
      'www',
    ];

    if (reservedSlugs.includes(slug)) {
      throw new BadRequestException(`The slug '${slug}' is reserved by the platform.`);
    }
  }

  async provisionClinic(dto: CreateClinicDto): Promise<IPlatformClinicSummary> {
    const cleanSlug = dto.slug.toLowerCase().trim();
    this.assertValidSlug(cleanSlug);

    const existingClinic = await this.clinicRepo.findOne({
      where: { slug: cleanSlug },
    });
    if (existingClinic) {
      throw new ConflictException(`Clinic with subdomain '${cleanSlug}' already exists.`);
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1. Create Clinic record
      const clinic = qr.manager.create(Clinic, {
        name: dto.name,
        slug: cleanSlug,
        clinic_type: dto.clinicType || ClinicType.DERMATOLOGY,
        status: ClinicStatus.ACTIVE,
        currency: dto.currency || 'USD',
        default_language: dto.defaultLanguage || 'en',
        timezone: dto.timezone || 'UTC',
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
      });
      const savedClinic = await qr.manager.save(clinic);

      // 2. Create Platform-Controlled Branding
      const branding = qr.manager.create(ClinicBranding, {
        clinic_id: savedClinic.id,
        primary_color: dto.branding?.primaryColor || '#1890ff',
        secondary_color: dto.branding?.secondaryColor || null,
        welcome_message: dto.branding?.welcomeMessage || `Welcome to ${dto.name}`,
        logo_url: dto.branding?.logoUrl || null,
      });
      await qr.manager.save(branding);

      // 3. Configure Licensed Modules
      const defaultModules = [
        'dashboard',
        'patients',
        'appointments',
        'records',
        'services',
        'invoices',
      ];
      const activeModules = Array.from(new Set([...defaultModules, ...(dto.enabledModules || [])]));

      for (const modKey of activeModules) {
        const mod = qr.manager.create(ClinicModuleEntity, {
          clinic_id: savedClinic.id,
          module_key: modKey,
          is_enabled: true,
        });
        await qr.manager.save(mod);
      }

      // 4. Create Clinic Owner Role
      const ownerRole = qr.manager.create(Role, {
        clinic_id: savedClinic.id,
        name: 'clinic_owner',
        display_name: 'Clinic Owner / Medical Director',
        description: 'Full administrative access over clinic operations',
        is_system: true,
        permissions: [],
      });
      const savedRole = await qr.manager.save(ownerRole);

      // 5. Create Owner User
      const passwordHash = await argon2.hash(dto.owner.password);
      const ownerUser = qr.manager.create(User, {
        clinic_id: savedClinic.id,
        email: dto.owner.email.toLowerCase().trim(),
        password_hash: passwordHash,
        first_name: dto.owner.firstName,
        last_name: dto.owner.lastName,
        phone: dto.owner.phone,
        status: UserStatus.ACTIVE,
        is_platform_admin: false,
        roles: [savedRole],
      });
      await qr.manager.save(ownerUser);

      await qr.commitTransaction();

      return this.getClinicSummary(savedClinic.id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async listAllClinics(): Promise<IPlatformClinicSummary[]> {
    const clinics = await this.clinicRepo.find({
      relations: ['branding', 'modules'],
      order: { created_at: 'DESC' },
    });

    return clinics.map((c) => this.mapSummary(c));
  }

  async getClinicSummary(id: string): Promise<IPlatformClinicSummary> {
    const clinic = await this.clinicRepo.findOne({
      where: { id },
      relations: ['branding', 'modules'],
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return this.mapSummary(clinic);
  }

  async updateClinic(id: string, dto: UpdateClinicPlatformDto): Promise<IPlatformClinicSummary> {
    const clinic = await this.clinicRepo.findOne({
      where: { id },
      relations: ['branding', 'modules'],
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    if (dto.name) clinic.name = dto.name;
    if (dto.status) clinic.status = dto.status;
    if (dto.currency) clinic.currency = dto.currency;
    if (dto.timezone) clinic.timezone = dto.timezone;
    if (dto.defaultLanguage) clinic.default_language = dto.defaultLanguage;

    await this.clinicRepo.save(clinic);

    if (dto.branding) {
      let branding = await this.brandingRepo.findOne({ where: { clinic_id: id } });
      if (!branding) {
        branding = this.brandingRepo.create({ clinic_id: id });
      }
      Object.assign(branding, dto.branding);
      await this.brandingRepo.save(branding);
    }

    if (dto.enabledModules) {
      await this.moduleRepo.delete({ clinic_id: id });
      for (const modKey of dto.enabledModules) {
        const mod = this.moduleRepo.create({
          clinic_id: id,
          module_key: modKey,
          is_enabled: true,
        });
        await this.moduleRepo.save(mod);
      }
    }

    return this.getClinicSummary(id);
  }

  private mapSummary(c: Clinic): IPlatformClinicSummary {
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      clinicType: c.clinic_type || ClinicType.GENERAL_MEDICAL,
      status: c.status,
      currency: c.currency,
      timezone: c.timezone,
      defaultLanguage: c.default_language,
      branding: {
        primaryColor: c.branding?.primary_color || '#1890ff',
        secondaryColor: c.branding?.secondary_color,
        welcomeMessage: c.branding?.welcome_message,
        logoUrl: c.branding?.logo_url,
      },
      enabledModules: (c.modules || []).filter((m) => m.is_enabled).map((m) => m.module_key),
      createdAt: c.created_at.toISOString(),
      updatedAt: c.updated_at.toISOString(),
    };
  }
}
