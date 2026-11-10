import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { WhatsappOtpResponseDto } from './whatsapp-otp-response.dto';

export class WhatsappOtpTableResponseDto extends TableResponseDto<WhatsappOtpResponseDto> {
  @ApiProperty({ type: [WhatsappOtpResponseDto] })
  declare result: WhatsappOtpResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
