import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { WhatsappTemplateResponseDto } from './whatsapp-template-response.dto';

export class WhatsappTemplateTableResponseDto extends TableResponseDto<WhatsappTemplateResponseDto> {
  @ApiProperty({ type: [WhatsappTemplateResponseDto] })
  declare result: WhatsappTemplateResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
