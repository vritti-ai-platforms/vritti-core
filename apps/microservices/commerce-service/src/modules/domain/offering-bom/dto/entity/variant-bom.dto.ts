import type { OfferingBomLineDto } from './offering-bom-line.dto';

export class VariantBomSuggestionDto {
  id: string;
  name: string;
}

export class VariantBomDto {
  lines: OfferingBomLineDto[];
  suggestion: VariantBomSuggestionDto | null;

  // The suggestion is the inventory item already carrying this variant's SKU. It rides with the lines
  // because both only matter to the bill-of-materials view, and it is what the "add from suggestion"
  // and "create inventory item" actions are gated on.
  static from(lines: OfferingBomLineDto[], suggestion: { id: string; name: string } | null): VariantBomDto {
    const dto = new VariantBomDto();
    dto.lines = lines;
    dto.suggestion = suggestion ? { id: suggestion.id, name: suggestion.name } : null;
    return dto;
  }
}
