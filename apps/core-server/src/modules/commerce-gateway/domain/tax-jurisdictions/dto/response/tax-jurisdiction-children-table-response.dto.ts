import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { TaxJurisdictionResponseDto } from './tax-jurisdiction-response.dto';

export class TaxJurisdictionChildrenTableResponseDto extends TableResponseDto<TaxJurisdictionResponseDto> {
  @ApiProperty({ type: [TaxJurisdictionResponseDto] })
  declare result: TaxJurisdictionResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
