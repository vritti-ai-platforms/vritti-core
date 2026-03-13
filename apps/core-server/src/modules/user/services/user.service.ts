import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService, NotFoundException } from '@vritti/api-sdk';
import { type User, UserRoleValues, UserStatusValues } from '@/db/schema';
import { OrganizationRepository } from '../../organization/repositories/organization.repository';
import { SessionService } from '../../auth/root/services/session.service';
import { UserDto } from '../dto/entity/user.dto';
import { CreateUserWebhookDto } from '../dto/request/create-user-webhook.dto';
import { UpdateUserWebhookDto } from '../dto/request/update-user-webhook.dto';
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

  // Creates or updates portal user from cloud-server webhook; sends invite email to new users
  async createFromWebhook(dto: CreateUserWebhookDto): Promise<UserDto> {
    const isNew = !(await this.userRepository.findByEmail(dto.email));

    const user = await this.userRepository.upsertByEmail({
      email: dto.email,
      fullName: dto.fullName,
      organizationId: dto.orgId,
      role: (dto.role as (typeof UserRoleValues)[keyof typeof UserRoleValues]) ?? UserRoleValues.SUPPORT,
      status: 'PENDING',
    });

    this.logger.log(`Upserted portal user from webhook: ${user.email} (${user.id})`);

    // Only send invite email for newly created users, not re-invites
    if (isNew) {
      const org = await this.organizationRepository.findById(dto.orgId);
      if (!org) throw new NotFoundException('Organization not found.');
      const baseDomain = this.config.getOrThrow<string>('BASE_DOMAIN');
      const { accessToken } = await this.sessionService.createSession(user.id, 'SET_PASSWORD');
      const inviteUrl = `https://${org.subdomain}.${baseDomain}/set-password?token=${accessToken}`;
      await this.emailService.sendInviteEmail({ to: user.email, name: user.fullName, inviteUrl });
    }

    return UserDto.from(user);
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

  // Returns all portal users for an organisation
  async getUsersByOrg(orgId: string): Promise<UserDto[]> {
    const users = await this.userRepository.findByOrganizationId(orgId);
    return users.map(UserDto.from);
  }

  // Updates a portal user's details from cloud-server webhook
  async updateFromWebhook(id: string, dto: UpdateUserWebhookDto): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found.');
    const updated = await this.userRepository.update(id, {
      ...(dto.fullName && { fullName: dto.fullName }),
      ...(dto.role && { role: dto.role as (typeof UserRoleValues)[keyof typeof UserRoleValues] }),
      ...(dto.status && { status: dto.status as (typeof UserStatusValues)[keyof typeof UserStatusValues] }),
      updatedAt: new Date(),
    });
    return UserDto.from(updated);
  }
}
