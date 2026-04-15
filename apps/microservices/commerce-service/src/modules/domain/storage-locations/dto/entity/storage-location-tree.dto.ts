export interface StorageLocationTreeDto {
  id: string;
  name: string;
  path: string[];
  children?: StorageLocationTreeDto[];
}
