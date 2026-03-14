import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, EmailService, NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import { type AnyColumn, type SQL, and, asc, desc, eq, ilike, or } from '@vritti/api-sdk/drizzle-orm';
import { type User, UserRoleValues, UserStatusValues, users } from '@/db/schema';
import { SessionService } from '../../auth/root/services/session.service';
import { OrganizationRepository } from '../../organization/repositories/organization.repository';
import { UserDto } from '../dto/entity/user.dto';
import { CreateUserWebhookDto } from '../dto/request/create-user-webhook.dto';
import type { GetUsersWebhookDto } from '../dto/request/get-users-webhook.dto';
import { UpdateUserWebhookDto } from '../dto/request/update-user-webhook.dto';
import type { UsersTableResponseDto } from '../dto/response/users-table-response.dto';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  // Creates a portal user from cloud-server webhook and sends invite email
  async createFromWebhook(dto: CreateUserWebhookDto): Promise<SuccessResponseDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException({
        label: 'User Already Exists',
        detail: `A user with email ${dto.email} already exists in this organization.`,
        errors: [{ field: 'email', message: 'Already invited' }],
      });
    }

    const user = await this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      organizationId: dto.orgId,
      role: (dto.role as (typeof UserRoleValues)[keyof typeof UserRoleValues]) ?? UserRoleValues.SUPPORT,
      status: 'PENDING',
    });

    this.logger.log(`Created portal user from webhook: ${user.email} (${user.id})`);

    const org = await this.organizationRepository.findById(dto.orgId);
    if (!org) throw new NotFoundException('Organization not found.');
    const baseDomain = this.config.getOrThrow<string>('BASE_DOMAIN');
    const { accessToken } = await this.sessionService.createSession(user.id, 'SET_PASSWORD');
    const inviteUrl = `https://${org.subdomain}.${baseDomain}/accept-invite?token=${accessToken}`;
    await this.emailService.sendInviteEmail({ to: user.email, name: user.fullName, inviteUrl });

    return { success: true, message: 'User invited successfully.' };
  }

  // Finds a user by email for auth — returns entity (not DTO)
  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findByEmail(email);
  }

  // Finds a user by ID — returns entity (not DTO)
  async findById(id: string): Promise<User | undefined> {
    return this.userRepository.findById(id);
  }

  // Finds a user by ID or throws NotFoundException
  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  // Updates the last login timestamp for a user
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.updateLastLogin(id);
  }

  // Sets password hash and activates the user
  async setPassword(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.setPassword(id, passwordHash);
    this.logger.log(`Password set for user: ${id}`);
  }

  // Returns paginated, filtered, and sorted portal users for an organisation
  async getUsersByOrg(dto: GetUsersWebhookDto): Promise<UsersTableResponseDto> {
    const conditions: SQL[] = [eq(users.organizationId, dto.orgId)];

    if (dto.search) {
      const pattern = `%${dto.search}%`;
      conditions.push(or(ilike(users.fullName, pattern), ilike(users.email, pattern))!);
    }

    if (dto.filterStatus) {
      conditions.push(eq(users.status, dto.filterStatus as (typeof UserStatusValues)[keyof typeof UserStatusValues]));
    }

    // Build sort clause — default to createdAt desc
    const sortColumnMap: Record<string, AnyColumn> = {
      fullName: users.fullName,
      email: users.email,
      status: users.status,
      role: users.role,
      createdAt: users.createdAt,
    };
    const sortColumn = sortColumnMap[dto.sortField ?? 'createdAt'] ?? users.createdAt;
    const orderBy = dto.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const { rows, total } = await this.userRepository.findForTable({
      where: and(...conditions),
      orderBy,
      limit: dto.limit ?? 20,
      offset: dto.offset ?? 0,
    });

    return {
      result: rows.map(UserDto.from),
      count: total,
    };
  }

  // Updates a portal user's details from cloud-server webhook
  async updateFromWebhook(id: string, dto: UpdateUserWebhookDto): Promise<SuccessResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found.');
    await this.userRepository.update(id, {
      ...(dto.fullName && { fullName: dto.fullName }),
      ...(dto.role && { role: dto.role as (typeof UserRoleValues)[keyof typeof UserRoleValues] }),
      ...(dto.status && { status: dto.status as (typeof UserStatusValues)[keyof typeof UserStatusValues] }),
      updatedAt: new Date(),
    });

    return { success: true, message: 'User updated successfully.' };
  }

  // Resends invitation email to a pending user with a fresh SET_PASSWORD token
  async resendInvite(id: string): Promise<SuccessResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found.');

    if (user.status !== 'PENDING') {
      throw new BadRequestException({
        label: 'Cannot Resend Invite',
        detail: 'Invitations can only be resent to users with pending status.',
      });
    }

    if (user.passwordHash) {
      throw new BadRequestException({
        label: 'Cannot Resend Invite',
        detail: 'This user has already set their password. They can log in directly.',
      });
    }

    // Clear any existing sessions before creating a fresh invite token
    await this.sessionService.deleteAllUserSessions(user.id);

    const org = await this.organizationRepository.findById(user.organizationId);
    if (!org) throw new NotFoundException('Organization not found.');

    const baseDomain = this.config.getOrThrow<string>('BASE_DOMAIN');
    const { accessToken } = await this.sessionService.createSession(user.id, 'SET_PASSWORD');
    const inviteUrl = `https://${org.subdomain}.${baseDomain}/accept-invite?token=${accessToken}`;
    await this.emailService.sendInviteEmail({ to: user.email, name: user.fullName, inviteUrl });

    this.logger.log(`Resent invitation to user: ${user.email} (${user.id})`);

    return { success: true, message: 'Invitation email resent successfully.' };
  }
}
