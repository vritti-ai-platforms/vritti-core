// Raw message template node as Meta Graph returns it. One template name can appear once per
// language — each language is its own node with its own review status.
export interface MetaGraphTemplate {
  id: string;
  name: string;
  status?: string;
  category?: string;
  language?: string;
  quality_score?: { score?: string };
  rejected_reason?: string;
}

export class WhatsappTemplateDto {
  id: string;
  name: string;
  status: string | null;
  category: string | null;
  language: string | null;
  qualityScore: string | null;
  rejectedReason: string | null;

  static from(raw: MetaGraphTemplate): WhatsappTemplateDto {
    const dto = new WhatsappTemplateDto();
    dto.id = raw.id;
    dto.name = raw.name;
    dto.status = raw.status ?? null;
    dto.category = raw.category ?? null;
    dto.language = raw.language ?? null;
    dto.qualityScore = raw.quality_score?.score ?? null;
    dto.rejectedReason = raw.rejected_reason ?? null;
    return dto;
  }
}
