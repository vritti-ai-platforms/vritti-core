import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { SmsOtpResponseDto } from './sms-otp-response.dto';

export class SmsOtpTableResponseDto extends TableResponseDto<SmsOtpResponseDto> {
  @ApiProperty({ type: [SmsOtpResponseDto] })
  declare result: SmsOtpResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
