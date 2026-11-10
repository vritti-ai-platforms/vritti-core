import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) => value === 'true' || value === true;

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

  @ApiPropertyOptional({ description: "Lists sites by this supplier's enrollments; not with inventoryItemId" })
  @IsOptional()
  @IsUUID('7')
  supplierId?: string;

  @ApiPropertyOptional({
    description: 'Lists sites by the enrollments of any supplier of this inventory item; not with supplierId',
  })
  @IsOptional()
  @IsUUID('7')
  inventoryItemId?: string;

  @ApiPropertyOptional({
    description:
      'With supplierId or inventoryItemId: true (default) lists the sites enrolled at, false the sites not enrolled at yet',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isEnrolled?: boolean;

  @ApiPropertyOptional({
    description: 'With enrolled sites: only those where the enrollment and the supplier are both active',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;
}
