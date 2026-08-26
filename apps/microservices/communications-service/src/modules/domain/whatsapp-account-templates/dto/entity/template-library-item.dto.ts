// Raw library entry as Meta Graph returns it from GET /message_template_library
export interface MetaGraphLibraryTemplate {
  id: string;
  name: string;
  language?: string;
  category?: string;
  topic?: string;
  usecase?: string;
  industry?: string[];
  header?: string;
  body?: string;
  body_params?: string[];
  body_param_types?: string[];
  buttons?: Record<string, unknown>[];
}

export class TemplateLibraryItemDto {
  id: string;
  name: string;
  language: string | null;
  category: string | null;
  topic: string | null;
  usecase: string | null;
  industry: string[];
  header: string | null;
  body: string | null;
  bodyParams: string[];
  buttons: Record<string, unknown>[];

  static from(raw: MetaGraphLibraryTemplate): TemplateLibraryItemDto {
    const dto = new TemplateLibraryItemDto();
    dto.id = raw.id;
    dto.name = raw.name;
    dto.language = raw.language ?? null;
    dto.category = raw.category ?? null;
    dto.topic = raw.topic ?? null;
    dto.usecase = raw.usecase ?? null;
    dto.industry = raw.industry ?? [];
    dto.header = raw.header ?? null;
    dto.body = raw.body ?? null;
    dto.bodyParams = raw.body_params ?? [];
    dto.buttons = raw.buttons ?? [];
    return dto;
  }
}
