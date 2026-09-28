import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { OfferingResponseDto } from './offering-response.dto';

// The list read measures neither count — both are correlated subqueries the detail read runs — so a table row does
// not carry them rather than reporting a zero it never measured
export class OfferingTableRowResponseDto extends OmitType(OfferingResponseDto, [
  'variantsFollowingTaxClassCount',
  'variantsMissingBomCount',
] as const) {}

export class OfferingTableResponseDto extends TableResponseDto<OfferingTableRowResponseDto> {
  @ApiProperty({ type: [OfferingTableRowResponseDto] })
  declare result: OfferingTableRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
