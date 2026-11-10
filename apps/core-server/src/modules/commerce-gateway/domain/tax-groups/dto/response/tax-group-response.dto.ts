import { ApiProperty } from '@nestjs/swagger';

export const TAX_TREATMENTS = ['TAXABLE', 'ZERO_RATED', 'EXEMPT', 'OUT_OF_SCOPE'] as const;

export class TaxGroupResponseDto {
  @ApiProperty({ description: 'Tax group ID' })
  id: string;

  @ApiProperty({
    description: 'Uppercase ISO 3166-1 alpha-2 country whose tax law the group belongs to',
    example: 'IN',
  })
  countryCode: string;

  @ApiProperty({ description: 'Code, unique within the country', example: 'gst-5' })
  code: string;

  @ApiProperty({ description: 'Tax group name', example: 'GST 5%' })
  name: string;

  @ApiProperty({ description: 'How supplies in the group are treated', enum: TAX_TREATMENTS })
  treatment: (typeof TAX_TREATMENTS)[number];

  @ApiProperty({ description: 'Text printed on documents, e.g. an exemption reason', type: String, nullable: true })
  legalText: string | null;

  @ApiProperty({ description: 'Whether the group can be picked' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of rates in the group' })
  rateCount: number;

  @ApiProperty({ description: 'Number of tax classes mapped to the group' })
  classCount: number;

  @ApiProperty({ description: 'Whether the group can be deleted (no tax class is mapped to it)' })
  canDelete: boolean;

  @ApiProperty({ description: 'Whether it can be deactivated (no class mapping in force or still to come names it)' })
  canDeactivate: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
