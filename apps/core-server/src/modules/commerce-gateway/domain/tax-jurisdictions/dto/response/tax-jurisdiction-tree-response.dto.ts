import { ApiProperty } from '@nestjs/swagger';

export class TaxJurisdictionTreeResponseDto {
  @ApiProperty({ description: 'Tax jurisdiction ID' })
  id: string;

  @ApiProperty({ description: 'Tax jurisdiction name' })
  name: string;

  @ApiProperty({
    description: 'Hierarchy level of the jurisdiction',
    enum: ['COUNTRY', 'STATE', 'COUNTY', 'CITY', 'DISTRICT'],
  })
  level: string;

  @ApiProperty({
    description: 'Child jurisdictions',
    type: () => TaxJurisdictionTreeResponseDto,
    isArray: true,
    required: false,
  })
  children?: TaxJurisdictionTreeResponseDto[];
}
