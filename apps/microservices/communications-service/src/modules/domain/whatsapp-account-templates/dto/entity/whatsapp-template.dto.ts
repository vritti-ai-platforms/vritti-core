// Raw message template node as Meta Graph returns it. One template name can appear once per
// language — each language is its own node with its own review status.
export interface MetaGraphTemplateComponent {
  type?: string;
  format?: string;
  text?: string;
  buttons?: { type?: string; text?: string }[];
}

export interface MetaGraphTemplate {
  id: string;
  name: string;
  status?: string;
  category?: string;
  language?: string;
  quality_score?: { score?: string };
  rejected_reason?: string;
  components?: MetaGraphTemplateComponent[];
}

export class WhatsappTemplateDto {
  id: string;
  name: string;
  status: string | null;
  category: string | null;
  language: string | null;
  qualityScore: string | null;
  rejectedReason: string | null;
  headerText: string | null;
  bodyText: string | null;
  footerText: string | null;
  buttons: string[];

  static from(raw: MetaGraphTemplate): WhatsappTemplateDto {
    const components = raw.components ?? [];
    const byType = (type: string) => components.find((c) => c.type?.toUpperCase() === type);
    const header = byType('HEADER');

    const dto = new WhatsappTemplateDto();
    dto.id = raw.id;
    dto.name = raw.name;
    dto.status = raw.status ?? null;
    dto.category = raw.category ?? null;
    dto.language = raw.language ?? null;
    dto.qualityScore = raw.quality_score?.score ?? null;
    dto.rejectedReason = raw.rejected_reason ?? null;
    // Media headers (IMAGE/VIDEO/DOCUMENT) carry no text — only TEXT headers preview as text
    dto.headerText = header?.format && header.format.toUpperCase() !== 'TEXT' ? null : (header?.text ?? null);
    dto.bodyText = byType('BODY')?.text ?? null;
    dto.footerText = byType('FOOTER')?.text ?? null;
    dto.buttons = (byType('BUTTONS')?.buttons ?? [])
      .map((button) => button.text ?? button.type ?? '')
      .filter((label) => label.length > 0);
    return dto;
  }
}
