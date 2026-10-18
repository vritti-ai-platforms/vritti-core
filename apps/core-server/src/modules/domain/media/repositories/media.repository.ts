import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, isNull, sql } from '@vritti/api-sdk/drizzle-orm';
import { type Media, MediaStatusValues, media } from '@/db/schema';

@Injectable()
export class MediaDomainRepository extends PrimaryBaseRepository<typeof media> {
  constructor(database: PrimaryDatabaseService) {
    super(database, media);
  }

  // Finds a media record by ID excluding soft-deleted records
  async findActiveById(id: string): Promise<Media | undefined> {
    return this.model.findFirst({
      where: { id, deletedAt: { isNull: true } },
    });
  }

  // Finds a single ready media record for an entity (1 media per entity)
  async findOneByEntity(organizationId: string, entityType: string, entityId: string): Promise<Media | undefined> {
    return this.model.findFirst({
      where: { organizationId, entityType, entityId, status: MediaStatusValues.READY, deletedAt: { isNull: true } },
    });
  }

  // Finds a ready media record matching the given checksum.
  async findByChecksum(organizationId: string, checksum: string, bucket: string): Promise<Media | undefined> {
    return this.model.findFirst({
      where: { organizationId, bucket, checksum, status: MediaStatusValues.READY, deletedAt: { isNull: true } },
    });
  }

  // Counts media records sharing the same storage key.
  async countByStorageKey(organizationId: string, storageKey: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(media)
      .where(and(eq(media.organizationId, organizationId), eq(media.storageKey, storageKey), isNull(media.deletedAt)));
    return Number(result[0]?.count ?? 0);
  }

  // Every storage key the org still has a record for.
  async findStorageKeys(organizationId: string): Promise<Set<string>> {
    const rows = await this.db
      .select({ storageKey: media.storageKey })
      .from(media)
      .where(and(eq(media.organizationId, organizationId), isNull(media.deletedAt)));
    return new Set(rows.map((r) => r.storageKey));
  }

  // Permanently deletes a media record from the database
  async hardDelete(id: string): Promise<void> {
    await this.db.delete(media).where(eq(media.id, id));
  }
}
