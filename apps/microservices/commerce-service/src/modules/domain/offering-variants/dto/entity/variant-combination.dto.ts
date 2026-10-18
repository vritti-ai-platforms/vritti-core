export class VariantCombinationDto {
  valueIds: string[];
  code: string;
  labels: string;
  exists: boolean;
}

export class VariantCombinationsDto {
  combinations: VariantCombinationDto[];
  total: number;
  existingCount: number;
}
