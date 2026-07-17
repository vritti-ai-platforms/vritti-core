import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaxClassDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Unique code within the org', example: 'gst-standard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Human-readable name', example: 'GST Standard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Whether the tax class is selectable', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
