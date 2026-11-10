import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { TaxJurisdictionResponseDto } from './tax-jurisdiction-response.dto';

export class TaxJurisdictionChildrenTableResponseDto extends TableResponseDto<TaxJurisdictionResponseDto> {
  @ApiProperty({ type: [TaxJurisdictionResponseDto] })
  declare result: TaxJurisdictionResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
