import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { SmsProviderResponseDto } from './sms-provider-response.dto';

export class SmsProviderTableResponseDto extends TableResponseDto<SmsProviderResponseDto> {
  @ApiProperty({ type: [SmsProviderResponseDto] })
  declare result: SmsProviderResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
