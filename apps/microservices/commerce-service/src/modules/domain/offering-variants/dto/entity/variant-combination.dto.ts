export class VariantCombinationDto {
  valueIds: string[];
  code: string;
  name: string;
  labels: string;
  exists: boolean;
}

export class VariantCombinationsDto {
  combinations: VariantCombinationDto[];
  total: number;
  existingCount: number;
}
