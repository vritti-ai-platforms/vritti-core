import type { SmsProvider, SmsProviderCode, SmsProviderType } from '@/db/schema';

// Credentials never appear here — the panel sees whether they exist, not what they are
export class SmsProviderDto {
  id: string;
  type: SmsProviderType;
  provider: SmsProviderCode;
  name: string;
  senderId: string | null;
  isActive: boolean;
  hasCredentials: boolean;
  createdAt: Date;
  updatedAt: Date;

  static from(entity: SmsProvider): SmsProviderDto {
    const dto = new SmsProviderDto();
    dto.id = entity.id;
    dto.type = entity.type;
    dto.provider = entity.provider;
    dto.name = entity.name;
    dto.senderId = entity.senderId ?? null;
    dto.isActive = entity.isActive;
    dto.hasCredentials = Object.keys(entity.credentials ?? {}).length > 0;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

// What the OTP send path needs — internal only, never a message-pattern response
export interface SmsProviderSendConfig {
  provider: SmsProviderCode;
  credentials: Record<string, unknown>;
  senderId: string | null;
}
