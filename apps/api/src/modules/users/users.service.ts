import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserStatus } from '@clinic/shared-types';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  /** Return a copy of the user with the password hash stripped (never leak it to clients). */
  private sanitize(user: User): User {
    const copy = { ...user } as User;
    delete (copy as any).password_hash;
    return copy;
  }

  /** argon2id with deliberately strong parameters, shared by all password writes. */
  private hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  /**
   * Changes a user's own password.
   *
   * Re-verifies the current password (a stolen/borrowed token alone must not be
   * enough to take over the account) and refuses a no-op change so a user cannot
   * "rotate" to the same secret and believe they are safer.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user) throw new NotFoundException('User not found');

    const currentMatches = await argon2.verify(
      user.password_hash,
      currentPassword,
    );
    if (!currentMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (await argon2.verify(user.password_hash, newPassword)) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    user.password_hash = await this.hashPassword(newPassword);
    await this.userRepo.save(user);
  }

  /** Sets a password directly (used by staff creation / admin reset flows). */
  async setPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.password_hash = await this.hashPassword(newPassword);
    await this.userRepo.save(user);
  }

  async findByEmailAndClinic(
    email: string,
    clinicId: string | null,
  ): Promise<User | null> {
    // `password_hash` is `select: false` on the entity, so re-select it here —
    // this is the only path that legitimately needs it (login verification).
    const qb = this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .leftJoinAndSelect('user.clinic', 'clinic')
      .where('user.email = :email', { email: email.toLowerCase() });
    // A query builder does not inherit the soft-delete filter, so a removed
    // account would otherwise still be able to sign in.
    qb.andWhere('user.deleted_at IS NULL');

    if (clinicId) {
      qb.andWhere('user.clinic_id = :clinicId', { clinicId });
    } else {
      qb.andWhere('user.clinic_id IS NULL');
    }

    return qb.getOne();
  }

  async findPlatformAdminByEmail(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.email = :email', { email: email.toLowerCase() })
      .andWhere('user.is_platform_admin = true')
      .andWhere('user.deleted_at IS NULL')
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions', 'clinic'],
    });
  }

  async findAllByClinic(clinicId: string): Promise<User[]> {
    const users = await this.userRepo.find({
      where: { clinic_id: clinicId },
      // Permissions ride along with the roles so the settings screen can show
      // what each staff member is actually allowed to do.
      relations: ['roles', 'roles.permissions'],
      order: { created_at: 'DESC' },
    });
    return users.map((user) => this.sanitize(user));
  }

  async createStaff(
    clinicId: string,
    data: {
      email: string;
      password?: string;
      firstName: string;
      lastName: string;
      phone?: string;
      roleIds: string[];
    },
  ): Promise<User> {
    const cleanEmail = data.email.toLowerCase().trim();

    // A removed staff member still occupies the (clinic, email) unique index.
    // Rather than refuse, bring the account back with the details just given.
    const existing = await this.userRepo.findOne({
      where: { clinic_id: clinicId, email: cleanEmail },
      withDeleted: true,
    });
    if (existing && !existing.deleted_at) {
      throw new ConflictException(`User with email '${cleanEmail}' already exists in this clinic.`);
    }

    const defaultPassword = data.password || 'Staff#Temp2026!';
    const passwordHash = await this.hashPassword(defaultPassword);

    let roles: Role[] = [];
    if (data.roleIds && data.roleIds.length > 0) {
      roles = await this.roleRepo.findBy({ id: In(data.roleIds) });
    }

    if (existing) {
      await this.userRepo.restore(existing.id);
      existing.deleted_at = null;
      existing.password_hash = passwordHash;
      existing.first_name = data.firstName;
      existing.last_name = data.lastName;
      existing.phone = data.phone || null;
      existing.status = UserStatus.ACTIVE;
      existing.roles = roles;
      return this.sanitize(await this.userRepo.save(existing));
    }

    const user = this.userRepo.create({
      clinic_id: clinicId,
      email: cleanEmail,
      password_hash: passwordHash,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone || null,
      status: UserStatus.ACTIVE,
      is_platform_admin: false,
      roles,
    });

    return this.sanitize(await this.userRepo.save(user));
  }

  async updateStaffStatus(
    clinicId: string,
    userId: string,
    status: UserStatus,
  ): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId, clinic_id: clinicId },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    user.status = status;
    return this.sanitize(await this.userRepo.save(user));
  }

  async assignRoles(
    clinicId: string,
    userId: string,
    roleIds: string[],
  ): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId, clinic_id: clinicId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('Staff member not found');

    const roles = await this.roleRepo.findBy({ id: In(roleIds) });
    user.roles = roles;
    return this.sanitize(await this.userRepo.save(user));
  }

  /**
   * Removes a staff member from the clinic.
   *
   * Soft delete: the row keeps its `deleted_at` stamp so every visit, invoice
   * and audit entry that references the person stays intact and reviewable,
   * while the account vanishes from the staff list and can no longer sign in.
   * A member has to be deactivated first, so removal is never a one-click
   * mistake on someone who is still working.
   */
  async removeStaff(
    clinicId: string,
    userId: string,
    requesterId?: string,
  ): Promise<{ id: string; removed: true }> {
    if (requesterId && requesterId === userId) {
      throw new BadRequestException('You cannot remove your own account');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId, clinic_id: clinicId },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException(
        'Suspend the staff member before removing the account',
      );
    }

    await this.userRepo.softDelete({ id: user.id });
    return { id: user.id, removed: true };
  }
}
