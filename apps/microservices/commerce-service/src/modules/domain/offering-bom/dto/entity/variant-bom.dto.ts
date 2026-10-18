import type { OfferingBomLineDto } from './offering-bom-line.dto';

export class VariantBomSuggestionDto {
  id: string;
  name: string;
}

export class VariantBomDto {
  lines: OfferingBomLineDto[];
  suggestion: VariantBomSuggestionDto | null;

  // The suggestion is the inventory item already carrying this variant's Code.
  static from(lines: OfferingBomLineDto[], suggestion: { id: string; name: string } | null): VariantBomDto {
    const dto = new VariantBomDto();
    dto.lines = lines;
    dto.suggestion = suggestion ? { id: suggestion.id, name: suggestion.name } : null;
    return dto;
  }
}
