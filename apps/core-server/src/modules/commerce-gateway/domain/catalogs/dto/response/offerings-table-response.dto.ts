import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { OfferingResponseDto } from './offering-response.dto';

export class OfferingsTableResponseDto extends TableResponseDto<OfferingResponseDto> {
  @ApiProperty({ type: [OfferingResponseDto] })
  declare result: OfferingResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
