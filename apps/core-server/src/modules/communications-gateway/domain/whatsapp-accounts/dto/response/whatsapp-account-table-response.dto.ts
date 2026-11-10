import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { WhatsappAccountResponseDto } from './whatsapp-account-response.dto';

export class WhatsappAccountTableResponseDto extends TableResponseDto<WhatsappAccountResponseDto> {
  @ApiProperty({ type: [WhatsappAccountResponseDto] })
  declare result: WhatsappAccountResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
