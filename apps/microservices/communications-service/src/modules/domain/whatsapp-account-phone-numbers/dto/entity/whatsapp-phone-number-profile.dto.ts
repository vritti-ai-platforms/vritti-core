// Raw business profile node as Meta Graph returns it (GET .../whatsapp_business_profile → { data: [node] })
export interface MetaGraphPhoneNumberProfile {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  vertical?: string;
  websites?: string[];
}

export class WhatsappPhoneNumberProfileDto {
  about: string | null;
  address: string | null;
  description: string | null;
  email: string | null;
  profilePictureUrl: string | null;
  vertical: string | null;
  websites: string[];

  static from(raw: MetaGraphPhoneNumberProfile): WhatsappPhoneNumberProfileDto {
    const dto = new WhatsappPhoneNumberProfileDto();
    dto.about = raw.about ?? null;
    dto.address = raw.address ?? null;
    dto.description = raw.description ?? null;
    dto.email = raw.email ?? null;
    dto.profilePictureUrl = raw.profile_picture_url ?? null;
    dto.vertical = raw.vertical ?? null;
    dto.websites = raw.websites ?? [];
    return dto;
  }
}
