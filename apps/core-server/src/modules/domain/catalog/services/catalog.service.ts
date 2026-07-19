import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { type VersionSnapshot } from '@vritti/api-sdk/catalog-resolver';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { ForbiddenException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CatalogLicense, hashSnapshot, type SignedDocument } from '@vritti/api-sdk/license';
import { verifyDocument } from '@vritti/api-sdk/signing';
import { AUTH_STATUS_EVENTS, SiteUpdatedEvent } from '@/common/events/auth-status.events';
import { PermissionSetCacheService } from '@/rbac/services/permission-set-cache.service';
import { SiteContextCacheService } from '@/site-context/site-context-cache.service';
import { CatalogDomainRepository } from '../repositories/catalog.repository';

@Injectable()
export class CatalogDomainService {
  private readonly logger = new Logger(CatalogDomainService.name);
  private readonly publicKey: string;
  private readonly deploymentId: string | undefined;
  // Verified snapshot cached per active row — re-verification is skipped while the same row stays active
  private snapshotCache: { rowId: string; snapshot: VersionSnapshot } | null = null;
  private warnedUnboundDeployment = false;

  constructor(
    private readonly catalogRepository: CatalogDomainRepository,
    private readonly siteContextCache: SiteContextCacheService,
    private readonly permissionSetCache: PermissionSetCacheService,
    private readonly eventEmitter: EventEmitter2,
    configService: ConfigService,
  ) {
    this.publicKey = configService.getOrThrow<string>('CLOUD_PUBLIC_KEY');
    this.deploymentId = configService.get<string>('DEPLOYMENT_ID');
  }

  // Receives a signed catalog license from cloud: verify, store/activate idempotently, prune, refresh live clients
  async receive(doc: SignedDocument<CatalogLicense>): Promise<SuccessResponseDto> {
    if (!verifyDocument(doc, this.publicKey)) {
      throw new ForbiddenException('Invalid catalog license signature.');
    }

    // Integrity: the embedded hash must match the snapshot it claims to describe
    if (hashSnapshot(doc.payload.snapshot) !== doc.payload.hash) {
      throw new ForbiddenException('Catalog snapshot does not match its license hash.');
    }

    this.checkDeploymentBinding(doc.payload.deploymentId);

    // Idempotent receive: an already-stored hash is just re-activated
    const existing = await this.catalogRepository.findByHash(doc.payload.hash);
    if (existing) {
      await this.catalogRepository.activate(existing.id);
    } else {
      await this.catalogRepository.insertAndActivate({
        version: doc.payload.version,
        hash: doc.payload.hash,
        license: doc,
      });
    }
    this.snapshotCache = null;

    const pruned = await this.catalogRepository.pruneKeep(5);
    if (pruned > 0) this.logger.log(`Pruned ${pruned} inactive catalog row(s)`);

    await this.refreshAllSites();

    this.logger.log(`Activated catalog version ${doc.payload.version} (hash ${doc.payload.hash.slice(0, 12)}…)`);
    return { success: true, message: `Catalog version "${doc.payload.version}" activated successfully.` };
  }

  // Loads the active snapshot, re-verifying the stored license; a dead document resolves to null
  async getActiveSnapshot(): Promise<VersionSnapshot | null> {
    const row = await this.catalogRepository.findActive();
    if (!row) return null;

    if (this.snapshotCache?.rowId === row.id) return this.snapshotCache.snapshot;

    if (!verifyDocument(row.license, this.publicKey)) {
      this.logger.error(
        `SECURITY ALERT: stored catalog license ${row.id} (version ${row.version}) failed signature verification — treating as dead`,
      );
      return null;
    }

    this.snapshotCache = { rowId: row.id, snapshot: row.license.payload.snapshot };
    return this.snapshotCache.snapshot;
  }

  // Re-activates an older catalog row (admin/ops escape hatch — no endpoint yet)
  async rollbackTo(catalogId: string): Promise<SuccessResponseDto> {
    const row = await this.catalogRepository.findById(catalogId);
    if (!row) throw new NotFoundException('Catalog version not found.');

    await this.catalogRepository.activate(row.id);
    this.snapshotCache = null;

    await this.refreshAllSites();

    this.logger.warn(`Rolled back to catalog version ${row.version} (${row.id})`);
    return { success: true, message: `Rolled back to catalog version "${row.version}".` };
  }

  // Rejects licenses bound to a different deployment; skips binding (with a one-time warning) when unset
  private checkDeploymentBinding(payloadDeploymentId: string): void {
    if (!this.deploymentId) {
      if (!this.warnedUnboundDeployment) {
        this.logger.warn('DEPLOYMENT_ID is not set — skipping catalog license deployment binding check');
        this.warnedUnboundDeployment = true;
      }
      return;
    }
    if (this.deploymentId !== payloadDeploymentId) {
      throw new ForbiddenException('Catalog license is bound to a different deployment.');
    }
  }

  // Drops the whole site context cache and re-pushes auth-state to live SSE clients of every site
  private async refreshAllSites(): Promise<void> {
    await this.siteContextCache.invalidateAll();
    await this.permissionSetCache.invalidateAll();
    const siteIds = await this.catalogRepository.findAllSiteIds();
    for (const siteId of siteIds) {
      this.eventEmitter.emit(AUTH_STATUS_EVENTS.SITE_UPDATED, new SiteUpdatedEvent(siteId));
    }
  }
}
