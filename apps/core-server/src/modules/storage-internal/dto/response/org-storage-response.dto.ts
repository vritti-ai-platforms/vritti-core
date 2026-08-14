import { ApiProperty } from '@nestjs/swagger';
import type { OrgStorage } from '@/db/schema';

// The org's object-storage descriptor handed back to cloud-server. The credential is returned in whatever form the
// writer stored it (plaintext or ciphertext) — core reads it straight off the org row and applies no treatment,
// matching how the media path consumes the same secret. `createdAt` is intentionally omitted from the wire shape.
export class OrgStorageResponseDto {
  @ApiProperty({ description: 'Object-storage provider', example: 'r2' })
  provider: string;

  @ApiProperty({ description: 'Provider account id the endpoint is derived from', example: 'a1b2c3d4e5f6' })
  accountId: string;

  @ApiProperty({ description: "The org's private bucket", example: 'acme-private' })
  bucket: string;

  @ApiProperty({ description: "The org's public bucket", example: 'acme-public' })
  publicBucket: string;

  @ApiProperty({
    description: 'Public base URL of publicBucket; null when public access could not be enabled',
    example: 'https://cdn.acme.example.com',
    nullable: true,
  })
  publicUrl: string | null;

  @ApiProperty({ description: 'S3 access key id scoped to the org buckets', example: 'AKIAEXAMPLE' })
  accessKeyId: string;

  @ApiProperty({ description: 'S3 secret access key, as stored by the writer', example: 'wJalr...EXAMPLE' })
  secretAccessKey: string;

  // Projects the stored descriptor onto the wire shape, dropping createdAt
  static from(storage: OrgStorage): OrgStorageResponseDto {
    const dto = new OrgStorageResponseDto();
    dto.provider = storage.provider;
    dto.accountId = storage.accountId;
    dto.bucket = storage.bucket;
    dto.publicBucket = storage.publicBucket;
    dto.publicUrl = storage.publicUrl;
    dto.accessKeyId = storage.accessKeyId;
    dto.secretAccessKey = storage.secretAccessKey;
    return dto;
  }
}
