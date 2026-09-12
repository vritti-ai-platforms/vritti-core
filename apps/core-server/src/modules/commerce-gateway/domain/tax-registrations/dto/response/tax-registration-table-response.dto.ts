import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { TaxRegistrationResponseDto } from './tax-registration-response.dto';

export class TaxRegistrationTableResponseDto extends TableResponseDto<TaxRegistrationResponseDto> {
  @ApiProperty({ type: [TaxRegistrationResponseDto] })
  declare result: TaxRegistrationResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional({ nullable: true })
  declare activeViewId: string | null;
}
