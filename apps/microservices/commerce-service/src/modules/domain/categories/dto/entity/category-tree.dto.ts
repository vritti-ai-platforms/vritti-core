export interface CategoryTreeDto {
  id: string;
  name: string;
  children?: CategoryTreeDto[];
}
