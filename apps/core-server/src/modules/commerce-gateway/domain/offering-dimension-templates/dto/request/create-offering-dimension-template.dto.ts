import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateOfferingDimensionTemplateDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Stable identifier, unique across the organization', example: 'apparel-size' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Template name', example: 'Apparel Size' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Trim()
  @ApiPropertyOptional({ description: 'What the template is for', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
