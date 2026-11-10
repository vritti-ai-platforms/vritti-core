import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { TaxRegistrationResponseDto } from './tax-registration-response.dto';

export class TaxRegistrationTableResponseDto extends TableResponseDto<TaxRegistrationResponseDto> {
  @ApiProperty({ type: [TaxRegistrationResponseDto] })
  declare result: TaxRegistrationResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional({ nullable: true })
  declare activeViewId: string | null;
}
