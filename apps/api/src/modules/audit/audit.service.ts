import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { IAuditLogEntry } from '@clinic/shared-types';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(entry: {
    clinicId?: string | null;
    userId: string;
    userEmail?: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: Record<string, { old: any; new: any }>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const log = this.auditRepo.create({
      clinic_id: entry.clinicId || null,
      user_id: entry.userId,
      user_email: entry.userEmail || null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      changes: entry.changes || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
    });

    return this.auditRepo.save(log);
  }

  async findAll(clinicId: string): Promise<IAuditLogEntry[]> {
    const logs = await this.auditRepo.find({
      where: { clinic_id: clinicId },
      order: { created_at: 'DESC' },
      take: 100,
    });

    return logs.map((l) => ({
      id: l.id,
      clinicId: l.clinic_id,
      userId: l.user_id,
      userEmail: l.user_email || 'staff@clinic.internal',
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      changes: l.changes || undefined,
      ipAddress: l.ip_address,
      userAgent: l.user_agent,
      createdAt: l.created_at.toISOString(),
    }));
  }
}
