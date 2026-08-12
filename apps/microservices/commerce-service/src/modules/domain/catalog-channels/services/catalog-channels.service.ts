import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { CatalogChannelDto } from '../dto/entity/catalog-channel.dto';
import { CatalogChannelsDomainRepository } from '../repositories/catalog-channels.repository';

@Injectable()
export class CatalogChannelsDomainService {
  private readonly logger = new Logger(CatalogChannelsDomainService.name);

  constructor(private readonly repository: CatalogChannelsDomainRepository) {}

  // Lists a catalog's channel assignments
  async listByCatalog(catalogId: string): Promise<CatalogChannelDto[]> {
    const rows = await this.repository.listByCatalog(catalogId);
    return rows.map((row) => CatalogChannelDto.from(row));
  }

  // Assigns a (site, channel) pair to a catalog, rejecting duplicates; RLS restricts writes to the caller's active site
  async assign(data: { catalogId: string; siteId: string; channelId: string }): Promise<CatalogChannelDto> {
    const existing = await this.repository.findBySiteAndChannel(data.siteId, data.channelId);
    if (existing) {
      throw new ConflictException('This site + channel is already mapped to a catalog.');
    }

    const row = await this.repository.assign(data);
    this.logger.log(`Assigned channel ${data.channelId} (site ${data.siteId}) to catalog ${data.catalogId}`);
    return CatalogChannelDto.from(row);
  }

  // Reconciles a catalog's channel set to the desired list, rejecting channels already mapped to another catalog
  async setChannels(catalogId: string, siteId: string, channelIds: string[]): Promise<void> {
    const desired = [...new Set(channelIds)];
    const existing = await this.repository.findByCatalogId(catalogId);
    const existingChannelIds = new Set(existing.map((row) => row.channelId));
    const desiredSet = new Set(desired);

    const toAdd = desired.filter((id) => !existingChannelIds.has(id));
    const toRemove = existing.filter((row) => !desiredSet.has(row.channelId)).map((row) => row.channelId);

    if (toAdd.length > 0) {
      const conflicts = await this.repository.findConflictingChannelNames(siteId, toAdd, catalogId);
      if (conflicts.length > 0) {
        throw new ConflictException(
          `${pluralize('Channel', conflicts.length)} ${conflicts.join(', ')} are already mapped to another catalog.`,
        );
      }
    }

    await this.repository.deleteByCatalogAndChannels(catalogId, toRemove);
    await this.repository.bulkInsert(toAdd.map((channelId) => ({ catalogId, siteId, channelId })));
    this.logger.log(`Set channels for catalog ${catalogId}: +${toAdd.length} -${toRemove.length}`);
  }

  // Removes a catalog-channel assignment
  async unassign(id: string): Promise<SuccessResponseDto> {
    await this.repository.unassign(id);
    this.logger.log(`Unassigned catalog-channel ${id}`);
    return { success: true, message: 'Channel assignment removed successfully.' };
  }

  // Returns a map of catalogId -> assignment count
  findCountsByCatalogIds(ids: string[]): Promise<Map<string, number>> {
    return this.repository.findCountsByCatalogIds(ids);
  }
}
