import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class SiteSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Only these sites (comma-separated or repeated); every site of the legal entity when omitted',
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsArray()
  @IsUUID('7', { each: true })
  ids?: string[];
}
