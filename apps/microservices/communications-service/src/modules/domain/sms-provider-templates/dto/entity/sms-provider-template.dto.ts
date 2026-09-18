import type { SmsProviderTemplate } from '@/db/schema';

export class SmsProviderTemplateDto {
  id: string;
  providerId: string;
  templateId: string;
  name: string;
  // The vendor payload as returned. Opaque on purpose — MSG91 documents no schema for it, so the
  // shape is discovered by looking, not by a type we would be inventing.
  details: Record<string, unknown>;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;

  static from(entity: SmsProviderTemplate): SmsProviderTemplateDto {
    const dto = new SmsProviderTemplateDto();
    dto.id = entity.id;
    dto.providerId = entity.providerId;
    dto.templateId = entity.templateId;
    dto.name = entity.name;
    dto.details = entity.details ?? {};
    dto.syncedAt = entity.syncedAt.toISOString();
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
