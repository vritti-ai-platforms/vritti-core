import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import { type ReplenishmentMethod, ReplenishmentMethodValues } from '@/db/schema';
import { SiteItemRefDto } from './site-item-ref.dto';

export class ReplenishmentDto extends SiteItemRefDto {
  @IsIn(Object.values(ReplenishmentMethodValues))
  replenishment: ReplenishmentMethod;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  safetyStock?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  reorderPoint?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  maxStock?: number | null;
}
