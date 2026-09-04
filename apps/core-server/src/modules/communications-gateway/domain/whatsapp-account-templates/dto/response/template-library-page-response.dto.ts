import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateLibraryItemResponseDto } from './template-library-item-response.dto';

// One page of library matches. `category` is narrowed server-side because Meta ignores it as a query
// parameter, so a page can hold fewer than the requested count while more still remain — the cursor,
// not the item count, is what says whether to keep going.
export class TemplateLibraryPageResponseDto {
  @ApiProperty({ type: [TemplateLibraryItemResponseDto] })
  items: TemplateLibraryItemResponseDto[];

  @ApiPropertyOptional({ description: "Meta's opaque cursor to resume from; null when the library is exhausted." })
  nextCursor: string | null;
}
