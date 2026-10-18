import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { OfferingResponseDto } from './offering-response.dto';

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
