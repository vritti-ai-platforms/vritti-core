import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  EmailService,
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  NotFoundException,
  type SearchState,
  type SortCondition,
  SuccessResponseDto,
} from '@vritti/api-sdk';
import { and, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { SessionTypeValues, type User, UserStatusValues, users } from '@/db/schema';
import { OrganizationRepository } from '@domain/organization/repositories/organization.repository';
import { SessionService } from '@domain/session/services/session.service';
import { UserDto } from '../dto/entity/user.dto';
import { CreateUserWebhookDto } from '../dto/request/create-user-webhook.dto';
import { UpdateUserWebhookDto } from '../dto/request/update-user-webhook.dto';
import type { UsersTableResponseDto } from '../dto/response/users-table-response.dto';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  private static readonly FIELD_MAP: FieldMap = {
    fullName: { column: users.fullName, type: 'string' },
    email: { column: users.email, type: 'string' },
    status: { column: users.status, type: 'string' },
    createdAt: { column: users.createdAt, type: 'string' },
  };

  constructor(
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  // Creates a portal user from cloud-server webhook and sends invite email
  async createFromWebhook(dto: CreateUserWebhookDto): Promise<SuccessResponseDto> {
    const existingUser = await this.userRepository.findByEmailAndOrg(dto.email, dto.orgId);
    if (existingUser) {
      throw new ConflictException({
        label: 'User Already Exists',
        detail: `A user with email ${dto.email} already exists in this organization.`,
        errors: [{ field: 'email', message: 'Already invited' }],
      });
    }

    const displayName = dto.fullName.trim().split(' ')[0];

    const user = await this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      displayName,
      organizationId: dto.orgId,
      status: 'PENDING',
      ...(dto.phone && { phone: dto.phone }),
      ...(dto.phoneCountry && { phoneCountry: dto.phoneCountry }),
    });

    this.logger.log(`Created portal user from webhook: ${user.email} (${user.id})`);

    const org = await this.organizationRepository.findById(dto.orgId);
    if (!org) throw new NotFoundException('Organization not found.');
    const baseDomain = this.config.getOrThrow<string>('BASE_DOMAIN');
    const { accessToken } = await this.sessionService.createSession(user.id, SessionTypeValues.SET_PASSWORD, {});
    const inviteUrl = `https://${org.subdomain}.${baseDomain}/accept-invite?token=${accessToken}`;
    await this.emailService.sendInviteEmail({ to: user.email, name: user.fullName, inviteUrl });

    return { success: true, message: 'User invited successfully.' };
  }

  // Finds a user by email for auth — returns entity (not DTO)
  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findByEmail(email);
  }

  // Finds a user by email within a specific organization — returns entity (not DTO)
  async findByEmailAndOrg(email: string, organizationId: string): Promise<User | undefined> {
    return this.userRepository.findByEmailAndOrg(email, organizationId);
  }

  // Finds all users with the given email across all orgs, with organization data
  async findAllByEmailWithOrg(email: string) {
    return this.userRepository.findAllByEmailWithOrg(email);
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

  // Returns paginated, filtered, and sorted portal users for the data table
  async getUsersForTable(
    orgId: string,
    filters: FilterCondition[],
    search: SearchState | null,
    sort: SortCondition[],
    limit: number,
    offset: number,
  ): Promise<UsersTableResponseDto> {
    const filterWhere = FilterProcessor.buildWhere(filters, UserService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(search, UserService.FIELD_MAP);
    const where = and(eq(users.organizationId, orgId), filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(sort, UserService.FIELD_MAP);

    const { rows, total } = await this.userRepository.findForTable({
      where,
      orderBy: orderBy[0] ?? desc(users.createdAt),
      limit,
      offset,
    });

    this.logger.log(`Fetched users table for org ${orgId} (${total} results)`);
    return { result: rows.map(UserDto.from), count: total };
  }

  // Updates a portal user's details from cloud-server webhook
  async updateFromWebhook(id: string, dto: UpdateUserWebhookDto): Promise<SuccessResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found.');

    // Check for email uniqueness within the same org if email is being changed
    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findByEmailAndOrg(dto.email, user.organizationId);
      if (existing) {
        throw new ConflictException({
          label: 'Email Already In Use',
          detail: `A user with email ${dto.email} already exists in this organization.`,
          errors: [{ field: 'email', message: 'Already in use' }],
        });
      }
    }

    await this.userRepository.update(id, {
      ...(dto.email && { email: dto.email }),
      ...(dto.fullName && { fullName: dto.fullName }),
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
    const { accessToken } = await this.sessionService.createSession(user.id, 'SET_PASSWORD', {});
    const inviteUrl = `https://${org.subdomain}.${baseDomain}/accept-invite?token=${accessToken}`;
    await this.emailService.sendInviteEmail({ to: user.email, name: user.fullName, inviteUrl });

    this.logger.log(`Resent invitation to user: ${user.email} (${user.id})`);

    return { success: true, message: 'Invitation email resent successfully.' };
  }
}
