import { ApiProperty } from '@nestjs/swagger';

export class TerminalPriceListResponseDto {
  @ApiProperty({ description: 'Terminal ID' })
  terminalId: string;

  @ApiProperty({ description: 'Price list ID' })
  priceListId: string;

  @ApiProperty({ description: 'Price list name' })
  priceListName: string;

  @ApiProperty({ description: 'Price list code' })
  priceListCode: string;

  @ApiProperty({ description: 'Price list merge priority' })
  priority: number;

  @ApiProperty({ description: 'Whether this is the terminal default price list' })
  isDefault: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
