import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { WhatsappAccountResponseDto } from './whatsapp-account-response.dto';

export class WhatsappAccountTableResponseDto extends TableResponseDto<WhatsappAccountResponseDto> {
  @ApiProperty({ type: [WhatsappAccountResponseDto] })
  declare result: WhatsappAccountResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
