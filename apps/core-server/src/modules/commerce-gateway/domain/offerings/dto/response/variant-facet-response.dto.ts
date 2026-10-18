import { ApiProperty } from '@nestjs/swagger';

export class VariantFacetValueResponseDto {
  @ApiProperty() code: string;
  @ApiProperty() value: string;
}

// A variant has no name of its own: its offering supplies the title and these supply what tells it from its
// siblings. Dimensions carry exactly one value each, attributes one or more.
export class VariantFacetResponseDto {
  @ApiProperty({ description: 'The dimension or attribute code, e.g. pack-size' })
  code: string;

  @ApiProperty({ description: 'Its name, for a label' })
  label: string;

  @ApiProperty({ type: [VariantFacetValueResponseDto] })
  values: VariantFacetValueResponseDto[];
}
