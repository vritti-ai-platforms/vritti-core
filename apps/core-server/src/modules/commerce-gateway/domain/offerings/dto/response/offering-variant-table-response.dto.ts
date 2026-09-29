import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { OfferingVariantResponseDto } from './offering-variant-response.dto';

export class OfferingVariantTableRowResponseDto extends OfferingVariantResponseDto {}

export class OfferingVariantTableResponseDto extends TableResponseDto<OfferingVariantTableRowResponseDto> {
  @ApiProperty({ type: [OfferingVariantTableRowResponseDto] })
  declare result: OfferingVariantTableRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
