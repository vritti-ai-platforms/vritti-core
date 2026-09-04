import type {
  CustomTemplateFormData,
  TemplateLibraryItemData,
  WhatsappTemplateCategory,
} from '@/schemas/whatsapp-templates';

// Highest {{n}} placeholder in the body — Meta numbers variables 1..n contiguously
export function countTemplateVariables(body: string): number {
  const matches = body.match(/\{\{(\d+)\}\}/g) ?? [];
  if (!matches.length) return 0;
  return Math.max(...matches.map((m) => Number(m.replace(/\D/g, ''))));
}

// Renders {{n}} placeholders with their example values for the preview; unfilled ones stay visible
export function substituteVariables(body: string, examples: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (match, index) => {
    const value = examples[Number(index) - 1];
    return value?.trim() ? value : match;
  });
}

// Translates the custom editor's form (UTILITY/MARKETING only — AUTHENTICATION is library-only)
// into Meta's components payload
export function buildCustomComponents(data: CustomTemplateFormData): Record<string, unknown>[] {
  const components: Record<string, unknown>[] = [];

  if (data.headerText?.trim()) {
    components.push({ type: 'HEADER', format: 'TEXT', text: data.headerText.trim() });
  }

  const variableCount = countTemplateVariables(data.body);
  components.push({
    type: 'BODY',
    text: data.body,
    // Meta reviews the rendered example, so every variable must ship one
    ...(variableCount ? { example: { body_text: [data.exampleValues.slice(0, variableCount)] } } : {}),
  });

  if (data.footerText?.trim()) {
    components.push({ type: 'FOOTER', text: data.footerText.trim() });
  }

  const buttons: Record<string, unknown>[] = data.quickReplies
    .filter((text) => text.trim())
    .map((text) => ({ type: 'QUICK_REPLY', text: text.trim() }));
  if (data.urlButtonText?.trim() && data.urlButtonUrl?.trim()) {
    buttons.push({ type: 'URL', text: data.urlButtonText.trim(), url: data.urlButtonUrl.trim() });
  }
  if (buttons.length) {
    components.push({ type: 'BUTTONS', buttons });
  }

  return components;
}

// Button labels the preview shows for the custom editor's current values
export function customPreviewButtons(data: CustomTemplateFormData): string[] {
  const labels = data.quickReplies.filter((text) => text.trim());
  if (data.urlButtonText?.trim()) labels.push(data.urlButtonText.trim());
  return labels;
}

/**
 * Button inputs Meta requires alongside a library template reference.
 *
 * AUTHENTICATION is not optional: Meta rejects the create outright with "Message templates in the
 * AUTHENTICATION category must have exactly one button, which must be of the OTP type" (code 100,
 * subcode 2388148) unless exactly one OTP button is supplied. COPY_CODE is the variant our sender
 * already renders — it passes the code as the button's parameter.
 *
 * For every other category the only input a library entry may need is the base URL behind a website
 * button, and only when the entry actually has one.
 */
export function buildLibraryButtonInputs(
  item: TemplateLibraryItemData,
  category: WhatsappTemplateCategory,
  websiteUrl?: string,
): Record<string, unknown>[] | undefined {
  if (category === 'AUTHENTICATION') return [{ type: 'OTP', otp_type: 'COPY_CODE' }];
  if (!libraryItemNeedsUrl(item) || !websiteUrl?.trim()) return undefined;
  return [{ type: 'URL', url: { base_url: websiteUrl.trim() } }];
}

export function libraryItemNeedsUrl(item: TemplateLibraryItemData): boolean {
  return item.buttons.some((button) => String(button.type ?? '').toUpperCase() === 'URL');
}

// Button labels the preview shows for a library entry
export function libraryPreviewButtons(item: TemplateLibraryItemData): string[] {
  return item.buttons.map((button) => String(button.text ?? button.type ?? 'Button'));
}
