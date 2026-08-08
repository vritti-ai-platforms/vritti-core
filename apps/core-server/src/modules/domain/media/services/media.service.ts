import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { OrganizationDomainRepository } from '@domain/organization/repositories/organization.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException, PayloadTooLargeException } from '@vritti/api-sdk/exceptions';
import type { StorageProvider } from '@vritti/api-sdk/storage';
import type { Media } from '@/db/schema';
import { MediaStatusValues } from '@/db/schema';
import { MediaDomainRepository } from '../repositories/media.repository';
import { OrgStorageResolverService, type ResolvedOrgStorage } from '../storage/org-storage-resolver.service';

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

interface FilePayload {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

interface UploadQuery {
  entityType: string;
  entityId: string;
}

export interface PublicMediaResult extends MediaResult {
  url: string;
}

export interface MediaResult {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class MediaDomainService {
  private readonly logger = new Logger(MediaDomainService.name);
  private readonly maxFileSize: number;
  private readonly signedUrlExpiry: number;

  constructor(
    private readonly mediaRepository: MediaDomainRepository,
    private readonly organizationRepository: OrganizationDomainRepository,
    private readonly storageResolver: OrgStorageResolverService,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSize = this.configService.getOrThrow<number>('MEDIA_MAX_FILE_SIZE_MB') * 1024 * 1024;
    this.signedUrlExpiry = this.configService.getOrThrow<number>('MEDIA_SIGNED_URL_EXPIRY');
  }

  // Loads an org's storage descriptor and the client authenticated with its own credentials
  private async resolveOrgStorage(organizationId: string, forWrite = false): Promise<ResolvedOrgStorage> {
    const org = await this.organizationRepository.findById(organizationId);
    if (!org) throw new NotFoundException('Organization not found.');

    // Only writes are gated. Reads and deletes stay open on purpose: an org over its quota must still be able to see
    // what it has and delete some of it, or it has no way back under the limit.
    if (forWrite && !org.storageEnabled) {
      throw new PayloadTooLargeException({
        label: 'Storage Limit Reached',
        detail: 'This organization has used its full storage allowance. Delete files or upgrade the plan to continue.',
      });
    }

    return this.storageResolver.resolve(org.storage);
  }

  // Uploads into the org's private bucket — readable only through a presigned URL
  async upload(
    file: FilePayload,
    organizationId: string,
    uploadedBy: string,
    query: UploadQuery,
  ): Promise<MediaResult> {
    const resolved = await this.resolveOrgStorage(organizationId, true);
    return this.store(file, organizationId, uploadedBy, query, resolved, resolved.storage.bucket);
  }

  // Uploads into the org's public bucket and returns the permanent URL. Use for assets rendered in lists, where a
  // presigned URL per object would mean an API round trip per image.
  async uploadPublic(
    file: FilePayload,
    organizationId: string,
    uploadedBy: string,
    query: UploadQuery,
  ): Promise<PublicMediaResult> {
    const resolved = await this.resolveOrgStorage(organizationId, true);
    const { storage, provider } = resolved;
    if (!storage.publicUrl) {
      throw new BadRequestException({
        label: 'Public Storage Unavailable',
        detail: 'Public access has not been enabled for this organization’s storage.',
      });
    }

    const result = await this.store(file, organizationId, uploadedBy, query, resolved, storage.publicBucket);
    return { ...result, url: provider.getPublicUrl(result.storageKey, storage.publicBucket) };
  }

  // The shared upload path. `bucket` decides whether the object is private or public — everything else, including
  // dedup and replacement, behaves identically.
  private async store(
    file: FilePayload,
    organizationId: string,
    uploadedBy: string,
    query: UploadQuery,
    resolved: ResolvedOrgStorage,
    bucket: string,
  ): Promise<MediaResult> {
    this.validateFile(file);
    const checksum = this.computeChecksum(file.buffer);
    const { storage, provider } = resolved;

    // If entity already has media, delete old one first
    const existingForEntity = await this.mediaRepository.findOneByEntity(
      organizationId,
      query.entityType,
      query.entityId,
    );

    if (existingForEntity) {
      // The bucket has to match as well as the checksum. The same file uploaded to the other endpoint is not the same
      // object: short-circuiting across buckets would hand back a public URL for an object in the private bucket, or
      // report a private upload as done while the file stays world-readable in the public one.
      if (existingForEntity.checksum === checksum && existingForEntity.bucket === bucket) {
        this.logger.log(
          `Same file already exists for entity ${query.entityType}/${query.entityId}, returning existing`,
        );
        return this.toMediaResult(existingForEntity);
      }

      await this.deleteRecord(existingForEntity, provider);
      this.logger.log(`Replaced media ${existingForEntity.id} for entity ${query.entityType}/${query.entityId}`);
    }

    // Dedup: reuse storage key if the same org already stored an identical file
    const existing = await this.mediaRepository.findByChecksum(organizationId, checksum, bucket);
    let storageKey: string;

    if (existing) {
      storageKey = existing.storageKey;
    } else {
      storageKey = this.generateStorageKey(organizationId, file.filename, query.entityType);
      await provider.upload({
        key: storageKey,
        body: file.buffer,
        contentType: file.mimetype,
        bucket,
      });
    }

    try {
      const record = await this.mediaRepository.create({
        organizationId,
        originalName: file.filename,
        mimeType: file.mimetype,
        size: file.buffer.length,
        checksum,
        storageKey,
        bucket,
        provider: storage.provider,
        status: MediaStatusValues.READY,
        entityType: query.entityType,
        entityId: query.entityId,
        uploadedBy,
      });

      this.logger.log(
        `Uploaded media ${record.id}: ${file.filename} (${file.buffer.length} bytes)${existing ? ' [dedup]' : ''}`,
      );
      return this.toMediaResult(record);
    } catch (error) {
      if (!existing) {
        await provider.delete(storageKey, bucket).catch(() => {});
      }
      throw error;
    }
  }

  // Generates a presigned download URL for a media item
  async getPresignedUrl(id: string): Promise<{ url: string; expiresIn: number }> {
    const record = await this.findRecordById(id);
    const { provider } = await this.resolveOrgStorage(record.organizationId);
    const url = await provider.getSignedUrl(record.storageKey, this.signedUrlExpiry, record.bucket ?? undefined);
    return { url, expiresIn: this.signedUrlExpiry };
  }

  // Deletes a media record and removes the storage file if no other records reference it
  async delete(id: string): Promise<void> {
    const record = await this.findRecordById(id);
    // Not gated on the quota: an org over its limit has to be able to delete its way back under
    const { provider } = await this.resolveOrgStorage(record.organizationId);
    await this.deleteRecord(record, provider);
    this.logger.log(`Deleted media ${id}`);
  }

  // Finds a media record by ID or throws NotFoundException
  private async findRecordById(id: string): Promise<Media> {
    const record = await this.mediaRepository.findActiveById(id);
    if (!record) {
      throw new NotFoundException('Media not found.');
    }
    return record;
  }

  // Deletes a media record and removes storage file if no other records reference it
  private async deleteRecord(record: Media, provider: StorageProvider): Promise<void> {
    await this.mediaRepository.hardDelete(record.id);

    const remaining = await this.mediaRepository.countByStorageKey(record.organizationId, record.storageKey);
    if (remaining === 0) {
      await provider.delete(record.storageKey, record.bucket ?? undefined);
    }
  }

  // Validates file size and MIME type
  private validateFile(file: FilePayload): void {
    if (file.buffer.length > this.maxFileSize) {
      throw new BadRequestException({
        label: 'File Too Large',
        detail: `File size exceeds the maximum allowed size of ${this.maxFileSize / (1024 * 1024)} MB.`,
      });
    }

    if (!DEFAULT_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException({
        label: 'Unsupported File Type',
        detail: `The file type '${file.mimetype}' is not allowed. Allowed types: PNG, JPG, GIF, WebP, SVG.`,
      });
    }
  }

  // Computes SHA-256 checksum of file buffer
  private computeChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  // Sanitizes a string for use as a storage key path segment
  private sanitizePathSegment(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  // Generates a storage key: {organizationId}/{entityType}/{uuid}.{ext}. The org bucket already isolates tenants, but
  // keeping the org in the key means a mis-targeted bucket cannot collide and a shared-bucket fallback stays possible.
  private generateStorageKey(organizationId: string, filename: string, entityType: string): string {
    const ext = extname(filename).toLowerCase();
    const uuid = randomUUID();
    const prefix = this.sanitizePathSegment(entityType);
    return `${organizationId}/${prefix}/${uuid}${ext}`;
  }

  // Maps a Media record to a MediaResult
  private toMediaResult(record: Media): MediaResult {
    return {
      id: record.id,
      storageKey: record.storageKey,
      originalName: record.originalName,
      mimeType: record.mimeType,
      size: record.size,
    };
  }
}
