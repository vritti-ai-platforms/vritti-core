import type { WhatsappAccount } from '@/db/schema';

export class WhatsappAccountDto {
  id: string;
  legalEntityId: string | null;
  metaBusinessId: string;
  wabaId: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  webhooksSubscribed: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps the entity, dropping accessToken so the credential never leaves this service
  static from(entity: WhatsappAccount): WhatsappAccountDto {
    const dto = new WhatsappAccountDto();
    dto.id = entity.id;
    dto.legalEntityId = entity.legalEntityId;
    dto.metaBusinessId = entity.metaBusinessId;
    dto.wabaId = entity.wabaId;
    dto.name = entity.name;
    dto.isDefault = entity.isDefault;
    dto.isActive = entity.isActive;
    dto.webhooksSubscribed = entity.webhooksSubscribed;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
