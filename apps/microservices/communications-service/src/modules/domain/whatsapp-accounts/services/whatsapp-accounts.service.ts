import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { whatsappAccounts } from '@/db/schema';
import { WhatsappAccountDto } from '../dto/entity/whatsapp-account.dto';
import { CreateWhatsappAccountDto } from '../dto/request/create-whatsapp-account.dto';
import { UpdateWhatsappAccountDto } from '../dto/request/update-whatsapp-account.dto';
import { WhatsappAccountsDomainRepository } from '../repositories/whatsapp-accounts.repository';

@Injectable()
export class WhatsappAccountsDomainService {
  private readonly logger = new Logger(WhatsappAccountsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: whatsappAccounts.name, type: 'string' },
    wabaId: { column: whatsappAccounts.wabaId, type: 'string' },
    metaBusinessId: { column: whatsappAccounts.metaBusinessId, type: 'string' },
    isDefault: { column: whatsappAccounts.isDefault, type: 'boolean' },
    isActive: { column: whatsappAccounts.isActive, type: 'boolean' },
    createdAt: { column: whatsappAccounts.createdAt, type: 'string' },
  };

  constructor(private readonly repository: WhatsappAccountsDomainRepository) {}

  // Returns paginated, filtered, and sorted WhatsApp accounts for the data table
  async findForTable(state: TableViewState): Promise<{ result: WhatsappAccountDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, WhatsappAccountsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, WhatsappAccountsDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, WhatsappAccountsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(whatsappAccounts.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(WhatsappAccountDto.from), count };
  }

  // Connects a WABA to this organization, rejecting one already connected
  async create(data: CreateWhatsappAccountDto): Promise<CreateResponseDto<WhatsappAccountDto>> {
    const existing = await this.repository.findByWabaId(data.wabaId);
    if (existing) {
      throw new ConflictException({
        label: 'Account already connected',
        detail: `WhatsApp Business Account "${data.wabaId}" is already connected to this organization.`,
      });
    }

    // The first account connected becomes the default sender, so an org is never left unable to send
    const isFirst = !(await this.repository.findDefault());
    const isDefault = data.isDefault ?? isFirst;

    // Cleared first, not after: the partial unique index rejects a second default outright
    if (isDefault) await this.repository.clearDefaults();

    const entity = await this.repository.create({
      legalEntityId: data.legalEntityId ?? null,
      metaBusinessId: data.metaBusinessId,
      wabaId: data.wabaId,
      name: data.name,
      accessToken: data.accessToken,
      isDefault,
      isActive: data.isActive ?? true,
    });

    this.logger.log(`Connected WhatsApp account ${entity.wabaId} (${entity.id})`);
    return {
      success: true,
      message: `WhatsApp account "${entity.name}" connected successfully.`,
      data: WhatsappAccountDto.from(entity),
    };
  }

  // Returns a single WhatsApp account by ID
  async findById(id: string): Promise<WhatsappAccountDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('WhatsApp account not found.');
    return WhatsappAccountDto.from(entity);
  }

  // Resolves the WABA id and access token for Meta Graph calls made by sibling domain services.
  // Internal to the domain layer — never exposed through a message pattern, so the credential
  // stays inside this service's boundary
  async resolveGraphCredentials(id: string): Promise<{ wabaId: string; accessToken: string }> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('WhatsApp account not found.');
    return { wabaId: entity.wabaId, accessToken: entity.accessToken };
  }

  // Updates a WhatsApp account; an omitted accessToken leaves the stored credential untouched
  async update(id: string, data: Omit<UpdateWhatsappAccountDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('WhatsApp account not found.');

    if (data.isDefault) await this.repository.clearDefaults(id);

    await this.repository.update(id, data);

    this.logger.log(`Updated WhatsApp account ${existing.wabaId} (${id})`);
    return { success: true, message: `WhatsApp account "${data.name ?? existing.name}" updated successfully.` };
  }

  // Disconnects a WhatsApp account; refuses the default while another account could take its place
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('WhatsApp account not found.');

    if (existing.isDefault) {
      const count = await this.repository.count();
      if (count > 1) {
        throw new ConflictException({
          label: 'Default account',
          detail: `Cannot disconnect "${existing.name}" while it is the default sender. Make another account the default first.`,
        });
      }
    }

    await this.repository.delete(id);
    this.logger.log(`Disconnected WhatsApp account ${existing.wabaId} (${id})`);
    return { success: true, message: `WhatsApp account "${existing.name}" disconnected successfully.` };
  }
}
