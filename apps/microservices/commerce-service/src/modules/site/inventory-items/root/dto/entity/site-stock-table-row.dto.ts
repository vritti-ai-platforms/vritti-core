import type { SiteStockTableItemDto } from '@domain/inventory-items/dto/entity/scoped-inventory-item.dto';
import type { SiteStockDisplayDto } from './site-stock-display.dto';

export type SiteStockTableRowDto = Omit<SiteStockTableItemDto, 'displayUnitRatios'> & { display: SiteStockDisplayDto };
