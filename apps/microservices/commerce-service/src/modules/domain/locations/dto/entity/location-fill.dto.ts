export interface LocationFillDto {
  capacityPercent: number;
  weightUsed: number;
  weightMax: number | null;
  volumeUsed: number;
  volumeMax: number | null;
  unconfiguredItemCount: number;
}
