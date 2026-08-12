import { OrganizationDomainRepository } from '@domain/organization/repositories/organization.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { StorageProvider } from '@vritti/api-sdk/storage';
import type { OrgStorage } from '@/db/schema';
import { MediaDomainRepository } from '../repositories/media.repository';
import { OrgStorageResolverService } from '../storage/org-storage-resolver.service';

// An object younger than this is assumed to be an upload still in flight — its media row may be milliseconds away.
// Without the grace period the sweep races live uploads and deletes files that were about to become valid.
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

export interface SweepResult {
  scanned: number;
  deleted: number;
}

@Injectable()
export class MediaGcService {
  private readonly logger = new Logger(MediaGcService.name);

  constructor(
    private readonly mediaRepository: MediaDomainRepository,
    private readonly organizationRepository: OrganizationDomainRepository,
    private readonly storageResolver: OrgStorageResolverService,
    private readonly primaryDb: PrimaryDatabaseService,
  ) {}

  // Sweeps every org. One org's failure must not abandon the rest — a bad credential on one tenant should not stop
  // the others being cleaned.
  async sweepAll(): Promise<SweepResult> {
    const orgs = await this.organizationRepository.findAll();
    const total: SweepResult = { scanned: 0, deleted: 0 };

    for (const org of orgs) {
      try {
        const result = await this.sweepOrg(org.id);
        total.scanned += result.scanned;
        total.deleted += result.deleted;
      } catch (error: unknown) {
        this.logger.warn(`Media sweep failed for org ${org.id}: ${error}`);
      }
    }

    this.logger.log(
      `Media sweep finished: ${pluralize('object', total.scanned, true)} scanned, ${pluralize('orphan', total.deleted, true)} deleted`,
    );
    return total;
  }

  // Deletes objects in the org's buckets that no media record refers to
  async sweepOrg(organizationId: string): Promise<SweepResult> {
    const org = await this.organizationRepository.findById(organizationId);
    if (!org) throw new NotFoundException('Organization not found.');

    const { storage, provider } = this.storageResolver.resolve(org.storage);

    // The media read runs outside a request, so nothing has set app.org_id and the org_isolation policy would return
    // no rows — making every object look orphaned. Supplying the context is what stops this deleting the whole bucket.
    const knownKeys = await this.primaryDb.runWithRlsContext({ orgId: organizationId }, () =>
      this.mediaRepository.findStorageKeys(organizationId),
    );

    const result: SweepResult = { scanned: 0, deleted: 0 };
    for (const bucket of [storage.bucket, storage.publicBucket]) {
      const bucketResult = await this.sweepBucket(provider, bucket, knownKeys);
      result.scanned += bucketResult.scanned;
      result.deleted += bucketResult.deleted;
    }

    if (result.deleted > 0) {
      this.logger.log(
        `Org ${organizationId}: deleted ${result.deleted} orphaned ${pluralize('object', result.deleted)} of ${result.scanned}`,
      );
    }
    return result;
  }

  // Empties both of an org's buckets. Unlike the sweep this ignores media rows and the grace period — the org is
  // going away, so every object goes with it, including uploads still in flight.
  //
  // Takes the descriptor rather than an org id so it can run AFTER the row has been deleted. That ordering matters:
  // if it ran first and the row delete then failed, the org would still exist with every file destroyed.
  //
  // Core does this rather than the control plane because emptying needs S3 access, and the org's credential lives
  // only here. The control plane deletes the buckets afterwards, which R2 refuses while they still hold objects.
  async purgeObjects(storage: OrgStorage): Promise<number> {
    const { provider } = this.storageResolver.resolve(storage);
    let deleted = 0;

    for (const bucket of [storage.bucket, storage.publicBucket]) {
      let token: string | undefined;
      do {
        const page = await provider.listObjects(bucket, token);
        for (const object of page.objects) {
          await provider.delete(object.key, bucket);
          deleted++;
        }
        token = page.nextToken;
      } while (token);
    }

    this.logger.log(`Purged ${pluralize('object', deleted, true)} from ${storage.bucket} and ${storage.publicBucket}`);
    return deleted;
  }

  private async sweepBucket(provider: StorageProvider, bucket: string, knownKeys: Set<string>): Promise<SweepResult> {
    const cutoff = new Date(Date.now() - ORPHAN_GRACE_MS);
    const result: SweepResult = { scanned: 0, deleted: 0 };
    let token: string | undefined;

    do {
      const page = await provider.listObjects(bucket, token);
      result.scanned += page.objects.length;

      for (const object of page.objects) {
        if (knownKeys.has(object.key) || object.lastModified > cutoff) continue;

        // Logged individually: an unexplained delete from a tenant's bucket should be traceable afterwards
        await provider.delete(object.key, bucket);
        this.logger.log(`Deleted orphaned object ${bucket}/${object.key} (${object.size} bytes)`);
        result.deleted++;
      }

      token = page.nextToken;
    } while (token);

    return result;
  }
}
