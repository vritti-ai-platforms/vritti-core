import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateLibraryItemResponseDto } from './template-library-item-response.dto';

export class TemplateLibraryPageResponseDto {
  @ApiProperty({ type: [TemplateLibraryItemResponseDto] })
  items: TemplateLibraryItemResponseDto[];

  @ApiPropertyOptional({ description: "Meta's opaque cursor to resume from; null when the library is exhausted." })
  nextCursor: string | null;
}
