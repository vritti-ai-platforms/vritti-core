import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { WhatsappPhoneNumberResponseDto } from './whatsapp-phone-number-response.dto';

export class WhatsappPhoneNumberTableResponseDto extends TableResponseDto<WhatsappPhoneNumberResponseDto> {
  @ApiProperty({ type: [WhatsappPhoneNumberResponseDto] })
  declare result: WhatsappPhoneNumberResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
