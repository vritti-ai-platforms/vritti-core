import { ApiProperty } from '@nestjs/swagger';

export class VariantCombinationResponseDto {
  @ApiProperty({ type: [String] }) valueIds: string[];
  @ApiProperty({ description: 'Derived from the offering code plus one value code per dimension' }) sku: string;
  @ApiProperty() name: string;
  @ApiProperty({ description: 'Value names in dimension order' }) labels: string;
  @ApiProperty({ description: 'True when a variant already carries this exact combination' }) exists: boolean;
}

export class VariantCombinationsResponseDto {
  @ApiProperty({ type: [VariantCombinationResponseDto] }) combinations: VariantCombinationResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() existingCount: number;
}
