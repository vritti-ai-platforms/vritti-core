import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDimensionTemplateDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'What the template is for', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
