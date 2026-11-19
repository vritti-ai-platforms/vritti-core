import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ChangePurchaseNotesDto {
  @ApiProperty({ description: 'Notes; null clears them', type: String, nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes: string | null;
}
