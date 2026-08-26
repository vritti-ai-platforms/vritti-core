import type { TableResponse } from '@vritti/quantum-ui/types/api-response';

// Mirrors WhatsappTemplateResponseDto — read live from Meta, one row per name+language pair
export interface WhatsappTemplateData {
  id: string;
  name: string;
  status: string | null;
  category: string | null;
  language: string | null;
  qualityScore: string | null;
  rejectedReason: string | null;
}

export type WhatsappTemplatesTableResponse = TableResponse<WhatsappTemplateData>;
