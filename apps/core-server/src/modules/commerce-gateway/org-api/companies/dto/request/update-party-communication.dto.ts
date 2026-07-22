import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { PartyCommunicationAppDto } from './create-party-communication.dto';

export class UpdatePartyCommunicationDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'The email address or phone number', example: 'priya@acme.in' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value?: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary value for its channel' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Whether the communication is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [PartyCommunicationAppDto],
    description: 'Full set of messaging apps reachable on this number (phone only)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartyCommunicationAppDto)
  apps?: PartyCommunicationAppDto[];
}
