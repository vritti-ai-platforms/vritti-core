import { OrganizationDomainRepository } from '@domain/organization/repositories/organization.repository';
import { SessionDomainService } from '@domain/session/services/session.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  type SearchState,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SortCondition,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { and, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { EmailService } from '@vritti/api-sdk/email';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { AUTH_STATUS_EVENTS, UserUpdatedEvent } from '@/common/events/auth-status.events';
import { SessionTypeValues, type User, UserStatusValues, users } from '@/db/schema';
import { UserDto } from '../dto/entity/user.dto';
import { CreateUserInternalDto } from '../dto/request/create-user-internal.dto';
import { UpdateUserInternalDto } from '../dto/request/update-user-internal.dto';
import type { UsersTableResponseDto } from '../dto/response/users-table-response.dto';
import { UserDomainRepository } from '../repositories/user.repository';

export interface LookupOrganizationSummary {
  id: string;
  name: string;
  subdomain: string;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
}

export interface LookupOrganizationsResult {
  organizations: LookupOrganizationSummary[];
}

@Injectable()
export class UserDomainService {
  private readonly logger = new Logger(UserDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    fullName: { column: users.fullName, type: 'string' },
    email: { column: users.email, type: 'string' },
    status: { column: users.status, type: 'string' },
    createdAt: { column: users.createdAt, type: 'string' },
  };

  constructor(
    private readonly userRepository: UserDomainRepository,
    private readonly organizationRepository: OrganizationDomainRepository,
    private readonly sessionService: SessionDomainService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Returns paginated user options for the select component
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`Fetched user select options (limit: ${query.limit}, offset: ${query.offset})`);

    return this.userRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'fullName',
      description: query.descriptionKey || 'email',
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'fullName',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Creates a portal user from a cloud-server internal request and sends invite email
  async createFromCloud(dto: CreateUserInternalDto): Promise<SuccessResponseDto> {
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

    this.logger.log(`Created portal user from cloud: ${user.email} (${user.id})`);

    const org = await this.organizationRepository.findById(dto.orgId);
    if (!org) throw new NotFoundException('Organization not found.');
    const baseDomain = this.config.getOrThrow<string>('BASE_DOMAIN');
    const { accessToken } = await this.sessionService.createSession(user.id, SessionTypeValues.SET_PASSWORD, {
      organizationId: org.id,
      subdomain: org.subdomain,
    });
    const inviteUrl = `https://${org.subdomain}.${baseDomain}/accept-invite?token=${accessToken}`;
    await this.emailService.sendInviteEmail({
      to: user.email,
      name: user.fullName,
      inviteUrl,
    });

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

  // Looks up all organizations a user belongs to by email
  async lookupOrganizationsByEmail(email: string): Promise<LookupOrganizationsResult> {
    const usersWithOrg = await this.userRepository.findAllByEmailWithOrg(email);

    if (usersWithOrg.length === 0) {
      throw new NotFoundException({
        label: 'Account Not Found',
        detail: 'No account is associated with this email address. Please check the email and try again.',
        errors: [{ field: 'email', message: 'No organization found for this email' }],
      });
    }

    return {
      organizations: usersWithOrg.map((u) => ({
        id: u.organization.id,
        name: u.organization.name,
        subdomain: u.organization.subdomain,
        logoLightUrl: u.organization.logoLightUrl,
        logoDarkUrl: u.organization.logoDarkUrl,
      })),
    };
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
    const filterWhere = FilterProcessor.buildWhere(filters, UserDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(search, UserDomainService.FIELD_MAP);
    const where = and(eq(users.organizationId, orgId), filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(sort, UserDomainService.FIELD_MAP);

    const { rows, total } = await this.userRepository.findForTable({
      where,
      orderBy: orderBy[0] ?? desc(users.createdAt),
      limit,
      offset,
    });

    this.logger.log(`Fetched users table for org ${orgId} (${total} results)`);
    return { result: rows.map(UserDto.from), count: total };
  }

  // Updates a portal user's details from a cloud-server internal request
  async updateFromCloud(id: string, dto: UpdateUserInternalDto): Promise<SuccessResponseDto> {
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
      ...(dto.status && {
        status: dto.status as (typeof UserStatusValues)[keyof typeof UserStatusValues],
      }),
      ...(dto.locale && { locale: dto.locale }),
      ...(dto.timezone && { timezone: dto.timezone }),
      updatedAt: new Date(),
    });

    // Re-push fresh auth-state to the user's live SSE connections (locale/timezone changed)
    this.eventEmitter.emit(AUTH_STATUS_EVENTS.USER_UPDATED, new UserUpdatedEvent(id));

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
    const { accessToken } = await this.sessionService.createSession(user.id, 'SET_PASSWORD', {
      organizationId: org.id,
      subdomain: org.subdomain,
    });
    const inviteUrl = `https://${org.subdomain}.${baseDomain}/accept-invite?token=${accessToken}`;
    await this.emailService.sendInviteEmail({
      to: user.email,
      name: user.fullName,
      inviteUrl,
    });

    this.logger.log(`Resent invitation to user: ${user.email} (${user.id})`);

    return { success: true, message: 'Invitation email resent successfully.' };
  }
}
