import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

// Mirrors WhatsappTemplateResponseDto — read live from Meta, one row per name+language pair
export interface WhatsappTemplateData {
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
}

export type WhatsappTemplatesTableResponse = TableResponse<WhatsappTemplateData>;

// Mirrors TemplateLibraryItemResponseDto — an entry from Meta's pre-approved template library
export interface TemplateLibraryItemData {
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
}

export interface CreateWhatsappTemplateData {
  name: string;
  language: string;
  category: 'AUTHENTICATION' | 'UTILITY' | 'MARKETING';
  components?: Record<string, unknown>[];
  libraryTemplateName?: string;
  libraryTemplateButtonInputs?: Record<string, unknown>[];
}

const templateName = z
  .string()
  .min(1, 'Name is required')
  .max(512)
  .regex(/^[a-z0-9_]+$/, 'Lowercase letters, digits, and underscores only');

const templateLanguage = z.string().min(2, 'Language is required').max(15);

export type WhatsappTemplateCategory = 'AUTHENTICATION' | 'UTILITY' | 'MARKETING';

// The custom editor's form — UTILITY/MARKETING content only. Category and language are picked on
// the wizard's basics step (AUTHENTICATION never reaches the custom editor: Meta writes its copy,
// so authentication templates are created from the library path).
export const customTemplateSchema = z
  .object({
    name: templateName,
    headerText: z.string().max(60).optional(),
    body: z.string().min(1, 'Body is required').max(1024),
    footerText: z.string().max(60).optional(),
    exampleValues: z.array(z.string().max(100)),
    quickReplies: z.array(z.string().max(25)),
    urlButtonText: z.string().max(25).optional(),
    urlButtonUrl: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    // Meta reviews the rendered example, so every {{n}} variable must have an example value
    const matches = data.body.match(/\{\{(\d+)\}\}/g) ?? [];
    const variableCount = matches.length ? Math.max(...matches.map((m) => Number(m.replace(/\D/g, '')))) : 0;
    for (let i = 0; i < variableCount; i++) {
      if (!data.exampleValues[i]?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['exampleValues', i], message: `Example for {{${i + 1}}} is required` });
      }
    }

    const hasText = Boolean(data.urlButtonText?.trim());
    const hasUrl = Boolean(data.urlButtonUrl?.trim());
    if (hasText !== hasUrl) {
      ctx.addIssue({
        code: 'custom',
        path: [hasText ? 'urlButtonUrl' : 'urlButtonText'],
        message: 'Button label and URL go together',
      });
    }
    if (hasUrl && !/^https?:\/\//.test(data.urlButtonUrl ?? '')) {
      ctx.addIssue({ code: 'custom', path: ['urlButtonUrl'], message: 'Must start with http(s)://' });
    }
  });

export type CustomTemplateFormData = z.infer<typeof customTemplateSchema>;

// The library path's config step — category, language, and content come from the basics step and
// the picked library template
export const libraryConfigSchema = z.object({
  name: templateName,
  websiteUrl: z.string().max(2000).optional(),
});

export type LibraryConfigFormData = z.infer<typeof libraryConfigSchema>;

// templateLanguage kept for the basics-step validation of the Meta-fed selector
export const templateLanguageSchema = templateLanguage;
