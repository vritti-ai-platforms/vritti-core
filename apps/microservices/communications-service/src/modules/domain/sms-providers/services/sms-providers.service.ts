import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type SmsProvider, smsProviders } from '@/db/schema';
import { SmsProviderDto, type SmsProviderSendConfig } from '../dto/entity/sms-provider.dto';
import type { CreateSmsProviderDto } from '../dto/request/create-sms-provider.dto';
import type { UpdateSmsProviderDto } from '../dto/request/update-sms-provider.dto';
import { SmsProvidersDomainRepository } from '../repositories/sms-providers.repository';

/**
 * One table serves two owners. CLIENT rows belong to the organization in the RLS context and take
 * the full org CRUD; PLATFORM rows (organization_id NULL) are Vritti-owned senders every org can
 * read and use but only cloud can write — those calls arrive over the internal patterns with no
 * RLS context, which is itself the isolation: with no org GUC set, the policy resolves only the
 * NULL-org rows, so a platform call can never touch a client row.
 */
@Injectable()
export class SmsProvidersDomainService {
  private readonly logger = new Logger(SmsProvidersDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: smsProviders.name, type: 'string' },
    provider: { column: smsProviders.provider, type: 'string' },
    type: { column: smsProviders.type, type: 'string' },
    isActive: { column: smsProviders.isActive, type: 'boolean' },
    createdAt: { column: smsProviders.createdAt, type: 'string' },
  };

  constructor(private readonly repository: SmsProvidersDomainRepository) {}

  // Returns paginated, filtered, and sorted providers — the org's own rows plus platform rows
  async findForTable(state: TableViewState): Promise<{ result: SmsProviderDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, SmsProvidersDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SmsProvidersDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SmsProvidersDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(smsProviders.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(SmsProviderDto.from), count };
  }

  // Returns paginated provider options for select dropdowns (the app OTP config picker)
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  async findById(id: string): Promise<SmsProviderDto> {
    return SmsProviderDto.from(await this.requireById(id));
  }

  // Connects an organization-owned provider account (org RLS context fills organization_id)
  async create(data: CreateSmsProviderDto): Promise<CreateResponseDto<SmsProviderDto>> {
    const entity = await this.repository.create({
      type: 'CLIENT',
      provider: data.provider,
      name: data.name,
      credentials: data.credentials ?? {},
      senderId: data.senderId ?? null,
      isActive: data.isActive ?? true,
    });

    this.logger.log(`Connected SMS provider ${entity.name} (${entity.provider}, ${entity.id})`);
    return { success: true, message: 'SMS provider connected successfully.', data: SmsProviderDto.from(entity) };
  }

  async update(id: string, data: Omit<UpdateSmsProviderDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);
    this.rejectPlatformWrite(existing);

    await this.repository.update(id, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.credentials !== undefined ? { credentials: data.credentials } : {}),
      ...(data.senderId !== undefined ? { senderId: data.senderId } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });

    return { success: true, message: 'SMS provider updated successfully.' };
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);
    this.rejectPlatformWrite(existing);

    await this.repository.delete(id);
    this.logger.log(`Removed SMS provider ${existing.name} (${id})`);
    return { success: true, message: 'SMS provider removed successfully.' };
  }

  // ---- Platform rows — reachable only through the internal (cloud-signed) patterns ----

  // Lists every platform row. Runs with no RLS context, so the policy alone scopes it to NULL-org rows
  async listPlatform(): Promise<SmsProviderDto[]> {
    const rows = await this.repository.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(SmsProviderDto.from);
  }

  async createPlatform(data: CreateSmsProviderDto): Promise<CreateResponseDto<SmsProviderDto>> {
    const entity = await this.repository.create({
      // Explicit null bypasses the column default, which would error with no org GUC set
      organizationId: null,
      type: 'PLATFORM',
      provider: data.provider,
      name: data.name,
      credentials: data.credentials ?? {},
      senderId: data.senderId ?? null,
      isActive: data.isActive ?? true,
    });

    this.logger.log(`Created platform SMS provider ${entity.name} (${entity.provider}, ${entity.id})`);
    return { success: true, message: 'Platform SMS provider created successfully.', data: SmsProviderDto.from(entity) };
  }

  async updatePlatform(id: string, data: Omit<UpdateSmsProviderDto, 'id'>): Promise<SuccessResponseDto> {
    await this.requireById(id);

    await this.repository.update(id, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.credentials !== undefined ? { credentials: data.credentials } : {}),
      ...(data.senderId !== undefined ? { senderId: data.senderId } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });

    return { success: true, message: 'Platform SMS provider updated successfully.' };
  }

  async deletePlatform(id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);

    await this.repository.delete(id);
    this.logger.log(`Deleted platform SMS provider ${existing.name} (${id})`);
    return { success: true, message: 'Platform SMS provider deleted successfully.' };
  }

  // What the OTP send path needs to deliver through this row — internal, never a message pattern
  async resolveSendConfig(id: string): Promise<SmsProviderSendConfig> {
    const provider = await this.requireById(id);
    if (!provider.isActive) {
      throw new BadRequestException({
        label: 'SMS provider inactive',
        detail: 'The configured SMS provider is deactivated. Pick another provider or reactivate it.',
      });
    }
    return { provider: provider.provider, credentials: provider.credentials ?? {}, senderId: provider.senderId };
  }

  private async requireById(id: string): Promise<SmsProvider> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('SMS provider not found.');
    return entity;
  }

  // Platform rows are visible to every org but managed only from cloud — hiding the buttons is
  // not enough, the write path itself must refuse
  private rejectPlatformWrite(entity: SmsProvider): void {
    if (entity.type === 'PLATFORM') {
      throw new BadRequestException({
        label: 'Managed by Vritti',
        detail: 'This provider is managed by the platform and cannot be changed here.',
      });
    }
  }
}
