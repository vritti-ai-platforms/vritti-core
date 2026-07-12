import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LegalEntity, TaxRegime } from '@/db/schema';

export class LegalEntityDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  organizationId: string;

  @ApiProperty({ example: 'acme-india' })
  code: string;

  @ApiProperty({ example: 'Acme Pharma Pvt Ltd' })
  name: string;

  @ApiProperty({ example: 'IN' })
  country: string;

  @ApiProperty({ example: 'INR' })
  currencyCode: string;

  @ApiProperty({ enum: ['GST', 'VAT', 'SALES_TAX', 'NONE'], example: 'GST' })
  taxRegime: TaxRegime;

  @ApiPropertyOptional({ example: 'AAACA1234F', nullable: true })
  taxId: string | null;

  @ApiProperty({ example: 4 })
  fiscalYearStart: number;

  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  parentId: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a LegalEntity entity
  static from(legalEntity: LegalEntity): LegalEntityDto {
    const dto = new LegalEntityDto();
    dto.id = legalEntity.id;
    dto.organizationId = legalEntity.organizationId;
    dto.code = legalEntity.code;
    dto.name = legalEntity.name;
    dto.country = legalEntity.country;
    dto.currencyCode = legalEntity.currencyCode;
    dto.taxRegime = legalEntity.taxRegime;
    dto.taxId = legalEntity.taxId ?? null;
    dto.fiscalYearStart = legalEntity.fiscalYearStart;
    dto.parentId = legalEntity.parentId ?? null;
    dto.isActive = legalEntity.isActive;
    dto.createdAt = legalEntity.createdAt.toISOString();
    dto.updatedAt = legalEntity.updatedAt.toISOString();
    return dto;
  }
}
