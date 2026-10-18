import { ApiProperty } from '@nestjs/swagger';

export class VariantFacetValueResponseDto {
  @ApiProperty() code: string;
  @ApiProperty() value: string;
}

export class VariantFacetResponseDto {
  @ApiProperty({ description: 'The dimension or attribute code, e.g. pack-size' })
  code: string;

  @ApiProperty({ description: 'Its name, for a label' })
  label: string;

  @ApiProperty({ type: [VariantFacetValueResponseDto] })
  values: VariantFacetValueResponseDto[];
}
