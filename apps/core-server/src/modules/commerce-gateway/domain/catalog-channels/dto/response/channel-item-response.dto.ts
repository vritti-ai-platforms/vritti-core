import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class ChannelItemResponseDto {
  @ApiProperty() listingId: string;
  @ApiProperty() offeringVariantId: string;
  @ApiPropertyOptional({ nullable: true }) sku: string | null;
  @ApiPropertyOptional({ nullable: true }) variantName: string | null;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) mrp: CurrencyAmountDto | null;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) price: CurrencyAmountDto | null;
  @ApiProperty({ description: 'False when this channel excludes the item' }) sellsHere: boolean;
}

export class ChannelItemTableResponseDto extends TableResponseDto<ChannelItemResponseDto> {
  @ApiProperty({ type: [ChannelItemResponseDto] }) declare result: ChannelItemResponseDto[];
  @ApiProperty() declare count: number;
  @ApiProperty() declare state: TableViewState;
  @ApiPropertyOptional({ nullable: true }) declare activeViewId: string | null;
}
