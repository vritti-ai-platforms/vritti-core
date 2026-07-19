import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { Media } from '@/db/schema';
import { MediaStatusValues } from '@/db/schema';
import { MediaDomainRepository } from '../repositories/media.repository';
import { StorageFactory } from '../storage/storage.factory';

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
  private readonly defaultBucket: string;
  private readonly maxFileSize: number;
  private readonly signedUrlExpiry: number;
  private readonly defaultProvider: string;

  constructor(
    private readonly mediaRepository: MediaDomainRepository,
    private readonly storageFactory: StorageFactory,
    private readonly configService: ConfigService,
  ) {
    this.defaultBucket = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
    this.maxFileSize = this.configService.getOrThrow<number>('MEDIA_MAX_FILE_SIZE_MB') * 1024 * 1024;
    this.signedUrlExpiry = this.configService.getOrThrow<number>('MEDIA_SIGNED_URL_EXPIRY');
    this.defaultProvider = this.configService.getOrThrow<string>('MEDIA_STORAGE_PROVIDER');
  }

  // Uploads a single file to storage and saves metadata to database
  async upload(file: FilePayload, uploadedBy: string, query: UploadQuery): Promise<MediaResult> {
    this.validateFile(file);
    const checksum = this.computeChecksum(file.buffer);

    // If entity already has media, delete old one first
    const existingForEntity = await this.mediaRepository.findOneByEntity(query.entityType, query.entityId);

    if (existingForEntity) {
      if (existingForEntity.checksum === checksum) {
        this.logger.log(
          `Same file already exists for entity ${query.entityType}/${query.entityId}, returning existing`,
        );
        return this.toMediaResult(existingForEntity);
      }

      await this.deleteRecord(existingForEntity);
      this.logger.log(`Replaced media ${existingForEntity.id} for entity ${query.entityType}/${query.entityId}`);
    }

    // Dedup: reuse storage key if identical file exists elsewhere
    const existing = await this.mediaRepository.findByChecksum(checksum);
    let storageKey: string;

    if (existing) {
      storageKey = existing.storageKey;
    } else {
      storageKey = this.generateStorageKey(file.filename, query.entityType);
      const provider = this.storageFactory.resolve(this.defaultProvider);
      await provider.upload({ key: storageKey, body: file.buffer, contentType: file.mimetype });
    }

    try {
      const record = await this.mediaRepository.create({
        originalName: file.filename,
        mimeType: file.mimetype,
        size: file.buffer.length,
        checksum,
        storageKey,
        bucket: this.defaultBucket,
        provider: this.defaultProvider,
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
        const provider = this.storageFactory.resolve(this.defaultProvider);
        await provider.delete(storageKey, this.defaultBucket).catch(() => {});
      }
      throw error;
    }
  }

  // Generates a presigned download URL for a media item
  async getPresignedUrl(id: string): Promise<{ url: string; expiresIn: number }> {
    const record = await this.findRecordById(id);
    const provider = this.storageFactory.resolve(record.provider);
    const url = await provider.getSignedUrl(record.storageKey, this.signedUrlExpiry, record.bucket ?? undefined);
    return { url, expiresIn: this.signedUrlExpiry };
  }

  // Deletes a media record and removes the storage file if no other records reference it
  async delete(id: string): Promise<void> {
    const record = await this.findRecordById(id);
    await this.deleteRecord(record);
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
  private async deleteRecord(record: Media): Promise<void> {
    await this.mediaRepository.hardDelete(record.id);

    const remaining = await this.mediaRepository.countByStorageKey(record.storageKey);
    if (remaining === 0) {
      const provider = this.storageFactory.resolve(record.provider);
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

  // Generates a storage key: {entityType}/{uuid}.{ext}
  private generateStorageKey(filename: string, entityType: string): string {
    const ext = extname(filename).toLowerCase();
    const uuid = randomUUID();
    const prefix = this.sanitizePathSegment(entityType);
    return `${prefix}/${uuid}${ext}`;
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
