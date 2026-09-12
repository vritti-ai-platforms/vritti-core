export class VariantCombinationDto {
  valueIds: string[];
  sku: string;
  name: string;
  labels: string;
  exists: boolean;
}

export class VariantCombinationsDto {
  combinations: VariantCombinationDto[];
  total: number;
  existingCount: number;
}
