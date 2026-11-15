import { PartialType } from '@nestjs/swagger';
import { CreateSiteStockLevelsDto } from './create-site-stock-levels.dto';

export class UpdateSiteStockLevelsDto extends PartialType(CreateSiteStockLevelsDto) {}
