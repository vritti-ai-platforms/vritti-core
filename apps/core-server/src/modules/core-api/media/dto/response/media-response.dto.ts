import type { MediaResult, PublicMediaResult } from '@domain/media/services/media.service';
import { ApiProperty } from '@nestjs/swagger';

export class MediaResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'product/9f1c.../a2b3.png' })
  storageKey: string;

  @ApiProperty({ example: 'photo.png' })
  originalName: string;

  @ApiProperty({ example: 'image/png' })
  mimeType: string;

  @ApiProperty({ example: 20481 })
  size: number;

  static from(result: MediaResult): MediaResponseDto {
    const dto = new MediaResponseDto();
    dto.id = result.id;
    dto.storageKey = result.storageKey;
    dto.originalName = result.originalName;
    dto.mimeType = result.mimeType;
    dto.size = result.size;
    return dto;
  }
}

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'Time-limited download URL' })
  url: string;

  @ApiProperty({ example: 3600, description: 'Seconds until the URL expires' })
  expiresIn: number;
}

export class PublicMediaResponseDto extends MediaResponseDto {
  @ApiProperty({ description: 'Permanent public URL — no signing, no expiry' })
  url: string;

  static fromPublic(result: PublicMediaResult): PublicMediaResponseDto {
    const dto = Object.assign(new PublicMediaResponseDto(), MediaResponseDto.from(result));
    dto.url = result.url;
    return dto;
  }
}
