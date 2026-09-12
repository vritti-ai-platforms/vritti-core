import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { OfferingVariantResponseDto } from './offering-variant-response.dto';

export class OfferingVariantTableResponseDto extends TableResponseDto<OfferingVariantResponseDto> {
  @ApiProperty({ type: [OfferingVariantResponseDto] })
  declare result: OfferingVariantResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
