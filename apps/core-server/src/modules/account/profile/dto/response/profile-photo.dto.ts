import { ApiProperty } from '@nestjs/swagger';

export class ProfilePhotoDto {
  @ApiProperty({ description: 'Identifier of the stored media item', example: '550e8400-e29b-41d4-a716-446655440000' })
  mediaId: string;

  @ApiProperty({ description: 'Time-limited URL for rendering the photo' })
  url: string;

  @ApiProperty({ description: 'Seconds until the URL expires', example: 3600 })
  expiresIn: number;

  // Creates a ProfilePhotoDto from a stored media item and its signed URL
  static from(mediaId: string, url: string, expiresIn: number): ProfilePhotoDto {
    const dto = new ProfilePhotoDto();
    dto.mediaId = mediaId;
    dto.url = url;
    dto.expiresIn = expiresIn;
    return dto;
  }
}
