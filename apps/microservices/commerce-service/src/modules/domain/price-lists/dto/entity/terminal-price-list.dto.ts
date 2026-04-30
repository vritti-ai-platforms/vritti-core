import type { TerminalPriceList } from '@/db/schema';

export class TerminalPriceListDto {
  terminalId: string;
  priceListId: string;
  priceListName: string;
  priceListCode: string;
  priority: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: TerminalPriceList & {
      priceListName: string;
      priceListCode: string;
    },
  ): TerminalPriceListDto {
    const dto = new TerminalPriceListDto();
    dto.terminalId = entity.terminalId;
    dto.priceListId = entity.priceListId;
    dto.priceListName = entity.priceListName;
    dto.priceListCode = entity.priceListCode;
    dto.priority = entity.priority;
    dto.isDefault = entity.isDefault;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
