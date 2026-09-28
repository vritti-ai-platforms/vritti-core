import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
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
