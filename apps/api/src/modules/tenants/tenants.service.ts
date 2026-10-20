import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from './entities/clinic.entity';
import { ClinicBranding } from './entities/clinic-branding.entity';
import { ClinicModule } from './entities/clinic-module.entity';
import { IClinicPublicConfig, ClinicType } from '@clinic/shared-types';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepo: Repository<Clinic>,
    @InjectRepository(ClinicBranding)
    private readonly brandingRepo: Repository<ClinicBranding>,
    @InjectRepository(ClinicModule)
    private readonly clinicModuleRepo: Repository<ClinicModule>,
  ) {}

  async findBySlug(slug: string): Promise<Clinic | null> {
    return this.clinicRepo.findOne({
      where: { slug: slug.toLowerCase() },
      relations: ['branding', 'modules'],
    });
  }

  async findById(id: string): Promise<Clinic | null> {
    return this.clinicRepo.findOne({
      where: { id },
      relations: ['branding', 'modules'],
    });
  }

  async isModuleEnabled(clinicId: string, moduleKey: string): Promise<boolean> {
    const mod = await this.clinicModuleRepo.findOne({
      where: { clinic_id: clinicId, module_key: moduleKey, is_enabled: true },
    });
    return !!mod;
  }

  async getPublicConfigBySlug(slug: string): Promise<IClinicPublicConfig> {
    const clinic = await this.findBySlug(slug);
    if (!clinic) {
      throw new NotFoundException(`Clinic with slug '${slug}' not found`);
    }

    const enabledModules = (clinic.modules || [])
      .filter((m) => m.is_enabled)
      .map((m) => m.module_key);

    return {
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      clinicType: clinic.clinic_type || ClinicType.GENERAL_MEDICAL,
      status: clinic.status,
      defaultLanguage: clinic.default_language,
      currency: clinic.currency,
      timezone: clinic.timezone,
      phone: clinic.phone,
      email: clinic.email,
      address: clinic.address,
      branding: {
        logoUrl: clinic.branding?.logo_url,
        faviconUrl: clinic.branding?.favicon_url,
        primaryColor: clinic.branding?.primary_color || '#2563EB',
        secondaryColor: clinic.branding?.secondary_color,
        welcomeMessage: clinic.branding?.welcome_message,
      },
      enabledModules,
    };
  }

  async updateProfile(
    clinicId: string,
    data: {
      name?: string;
      clinic_type?: ClinicType;
      phone?: string;
      email?: string;
      address?: string;
      default_language?: string;
      timezone?: string;
    },
  ): Promise<Clinic> {
    const clinic = await this.findById(clinicId);
    if (!clinic) throw new NotFoundException('Clinic not found');

    Object.assign(clinic, data);
    return this.clinicRepo.save(clinic);
  }

  async updateBranding(
    clinicId: string,
    data: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      welcomeMessage?: string;
    },
  ): Promise<ClinicBranding> {
    let branding = await this.brandingRepo.findOne({ where: { clinic_id: clinicId } });
    if (!branding) {
      branding = this.brandingRepo.create({
        clinic_id: clinicId,
        primary_color: data.primaryColor || '#2563EB',
        secondary_color: data.secondaryColor,
        logo_url: data.logoUrl,
        welcome_message: data.welcomeMessage,
      });
    } else {
      if (data.primaryColor) branding.primary_color = data.primaryColor;
      if (data.secondaryColor !== undefined) branding.secondary_color = data.secondaryColor;
      if (data.logoUrl !== undefined) branding.logo_url = data.logoUrl;
      if (data.welcomeMessage !== undefined) branding.welcome_message = data.welcomeMessage;
    }
    return this.brandingRepo.save(branding);
  }

  async toggleModule(clinicId: string, moduleKey: string, isEnabled: boolean): Promise<ClinicModule> {
    let mod = await this.clinicModuleRepo.findOne({
      where: { clinic_id: clinicId, module_key: moduleKey },
    });
    if (!mod) {
      mod = this.clinicModuleRepo.create({
        clinic_id: clinicId,
        module_key: moduleKey,
        is_enabled: isEnabled,
      });
    } else {
      mod.is_enabled = isEnabled;
    }
    return this.clinicModuleRepo.save(mod);
  }
}
