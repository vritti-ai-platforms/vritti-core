import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateOfferingDimensionFromTemplateDto {
  @ApiProperty({ description: 'Template whose code, name and values are copied onto the offering' })
  @IsUUID()
  templateId: string;
}
