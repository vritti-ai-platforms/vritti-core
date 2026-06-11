import type { CategoryRole } from '@/db/schema';

export interface CategoryTreeDto {
  id: string;
  name: string;
  categoryRole: CategoryRole;
  children?: CategoryTreeDto[];
}
