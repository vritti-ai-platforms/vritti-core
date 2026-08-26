// Raw phone number node as Meta Graph returns it (snake_case, throughput nested)
export interface MetaGraphPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  code_verification_status?: string;
  quality_rating?: string;
  platform_type?: string;
  throughput?: { level?: string };
  name_status?: string;
}

export class WhatsappPhoneNumberDto {
  id: string;
  displayPhoneNumber: string;
  verifiedName: string;
  codeVerificationStatus: string | null;
  qualityRating: string | null;
  platformType: string | null;
  throughputLevel: string | null;
  nameStatus: string | null;

  static from(raw: MetaGraphPhoneNumber): WhatsappPhoneNumberDto {
    const dto = new WhatsappPhoneNumberDto();
    dto.id = raw.id;
    dto.displayPhoneNumber = raw.display_phone_number;
    dto.verifiedName = raw.verified_name;
    dto.codeVerificationStatus = raw.code_verification_status ?? null;
    dto.qualityRating = raw.quality_rating ?? null;
    dto.platformType = raw.platform_type ?? null;
    dto.throughputLevel = raw.throughput?.level ?? null;
    dto.nameStatus = raw.name_status ?? null;
    return dto;
  }
}
