import type { TemplateLibraryItemDto } from './template-library-item.dto';

// One page of library results plus the cursor to resume from. Meta's own cursor is passed straight
// through — it is opaque to us and only ever handed back to Meta.
export class TemplateLibraryPageDto {
  items: TemplateLibraryItemDto[];
  nextCursor: string | null;
}
