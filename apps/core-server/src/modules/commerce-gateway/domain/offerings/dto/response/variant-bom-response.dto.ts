import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfferingBomLineResponseDto } from './offering-variant-response.dto';

export class VariantBomSuggestionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class VariantBomResponseDto {
  @ApiProperty({ type: [OfferingBomLineResponseDto] }) lines: OfferingBomLineResponseDto[];

  @ApiPropertyOptional({
    type: VariantBomSuggestionResponseDto,
    nullable: true,
    description: 'The inventory item already carrying this variant SKU, if one exists',
  })
  suggestion: VariantBomSuggestionResponseDto | null;
}
