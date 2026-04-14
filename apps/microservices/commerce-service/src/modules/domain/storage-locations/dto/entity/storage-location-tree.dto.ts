export interface StorageLocationTreeDto {
  id: string;
  name: string;
  children?: StorageLocationTreeDto[];
}
