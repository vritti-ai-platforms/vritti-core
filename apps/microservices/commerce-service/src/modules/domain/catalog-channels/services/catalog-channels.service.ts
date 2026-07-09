import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import { CatalogChannelDto } from '../dto/entity/catalog-channel.dto';
import { CatalogChannelsRepository } from '../repositories/catalog-channels.repository';

@Injectable()
export class CatalogChannelsService {
  private readonly logger = new Logger(CatalogChannelsService.name);

  constructor(private readonly repository: CatalogChannelsRepository) {}

  // Lists a catalog's channel assignments
  async listByCatalog(catalogId: string): Promise<CatalogChannelDto[]> {
    const rows = await this.repository.listByCatalog(catalogId);
    return rows.map((row) => CatalogChannelDto.from(row));
  }

  // Assigns a (BU, channel) pair to a catalog, rejecting duplicate mappings.
  // The BU-branch rule is enforced by the catalog_channels bu_write RLS policy:
  // an insert is permitted only when business_unit_id equals app.bu_id, so a BU
  // outside the caller's active context cannot be mapped. We pre-check the unique
  // (businessUnitId, channelId) constraint here; the 23505 race is caught globally.
  async assign(data: { catalogId: string; businessUnitId: string; channelId: string }): Promise<CatalogChannelDto> {
    const existing = await this.repository.findByBuAndChannel(data.businessUnitId, data.channelId);
    if (existing) {
      throw new ConflictException('This business unit + channel is already mapped to a catalog.');
    }

    const row = await this.repository.assign(data);
    this.logger.log(`Assigned channel ${data.channelId} (BU ${data.businessUnitId}) to catalog ${data.catalogId}`);
    return CatalogChannelDto.from(row);
  }

  // Reconciles a catalog's full channel set to the desired list, adding and removing
  // assignments as needed. Pre-checks the unique (BU, channel) constraint so a channel
  // already mapped to another catalog rejects the whole operation with a named conflict.
  async setChannels(catalogId: string, businessUnitId: string, channelIds: string[]): Promise<void> {
    const desired = [...new Set(channelIds)];
    const existing = await this.repository.findByCatalogId(catalogId);
    const existingChannelIds = new Set(existing.map((row) => row.channelId));
    const desiredSet = new Set(desired);

    const toAdd = desired.filter((id) => !existingChannelIds.has(id));
    const toRemove = existing.filter((row) => !desiredSet.has(row.channelId)).map((row) => row.channelId);

    if (toAdd.length > 0) {
      const conflicts = await this.repository.findConflictingChannelNames(businessUnitId, toAdd, catalogId);
      if (conflicts.length > 0) {
        throw new ConflictException(`Channel(s) ${conflicts.join(', ')} are already mapped to another catalog.`);
      }
    }

    await this.repository.deleteByCatalogAndChannels(catalogId, toRemove);
    await this.repository.bulkInsert(toAdd.map((channelId) => ({ catalogId, businessUnitId, channelId })));
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
