import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { SmsProviderTemplateResponseDto } from './sms-provider-template-response.dto';

export class SmsProviderTemplateTableResponseDto extends TableResponseDto<SmsProviderTemplateResponseDto> {
  @ApiProperty({ type: [SmsProviderTemplateResponseDto] })
  declare result: SmsProviderTemplateResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
