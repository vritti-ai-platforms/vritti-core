export interface LocationTreeDto {
  id: string;
  name: string;
  path: string[];
  children?: LocationTreeDto[];
}
