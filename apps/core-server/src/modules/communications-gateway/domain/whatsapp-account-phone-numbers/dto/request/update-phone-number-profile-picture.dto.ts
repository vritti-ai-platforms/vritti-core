import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdatePhoneNumberProfilePictureDto {
  // ~700KB of base64 — the frontend resizes to 640×640 JPEG, so real payloads are far smaller;
  // this cap keeps the forwarded NATS message under the broker's payload limit
  @ApiProperty({ description: 'Base64-encoded image bytes (no data: prefix). Square 640×640 recommended.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(950000)
  imageBase64: string;

  @ApiProperty({ enum: ['image/jpeg', 'image/png'], example: 'image/jpeg' })
  @IsIn(['image/jpeg', 'image/png'])
  mimeType: 'image/jpeg' | 'image/png';
}
