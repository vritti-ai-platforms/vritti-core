import { MetaGraphHttpService } from '@domain/meta-graph/services/meta-graph-http.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { type MetaGraphPhoneNumber, WhatsappPhoneNumberDto } from '../dto/entity/whatsapp-phone-number.dto';
import {
  type MetaGraphPhoneNumberProfile,
  WhatsappPhoneNumberProfileDto,
} from '../dto/entity/whatsapp-phone-number-profile.dto';
import type { CreateWhatsappPhoneNumberDto } from '../dto/request/create-whatsapp-phone-number.dto';
import type { RequestPhoneVerificationCodeDto } from '../dto/request/request-phone-verification-code.dto';

const PHONE_NUMBER_FIELDS =
  'id,display_phone_number,verified_name,code_verification_status,quality_rating,platform_type,throughput,name_status';

const PROFILE_FIELDS = 'about,address,description,email,profile_picture_url,vertical,websites';

// Phone numbers are read live from Meta — the WABA is the source of truth for verification status
// and quality, so nothing is persisted here (see the communications-permissions note)
export interface GraphCredentials {
  accountId: string;
  wabaId: string;
  accessToken: string;
}

@Injectable()
export class WhatsappAccountPhoneNumbersDomainService {
  private readonly logger = new Logger(WhatsappAccountPhoneNumbersDomainService.name);

  constructor(private readonly metaGraph: MetaGraphHttpService) {}

  // Lists the WABA's phone numbers straight from Meta
  async list(credentials: GraphCredentials): Promise<WhatsappPhoneNumberDto[]> {
    const { wabaId, accessToken } = credentials;
    const response = await this.metaGraph.get<{ data: MetaGraphPhoneNumber[] }>(
      accessToken,
      `/${wabaId}/phone_numbers`,
      { fields: PHONE_NUMBER_FIELDS },
    );
    return (response.data ?? []).map(WhatsappPhoneNumberDto.from);
  }

  // Adds a number to the WABA; it still needs verify + register before it can send
  async create(
    credentials: GraphCredentials,
    dto: CreateWhatsappPhoneNumberDto,
  ): Promise<CreateResponseDto<WhatsappPhoneNumberDto>> {
    const { wabaId, accessToken } = credentials;

    const created = await this.metaGraph.post<{ id: string }>(accessToken, `/${wabaId}/phone_numbers`, {
      cc: dto.cc,
      phone_number: dto.phoneNumber,
      verified_name: dto.verifiedName,
    });

    this.logger.log(`Added phone number ${created.id} to WABA ${wabaId} (account ${credentials.accountId})`);

    const detail = await this.metaGraph.get<MetaGraphPhoneNumber>(accessToken, `/${created.id}`, {
      fields: PHONE_NUMBER_FIELDS,
    });

    return {
      success: true,
      message: 'Phone number added. Verify it to finish the setup.',
      data: WhatsappPhoneNumberDto.from(detail),
    };
  }

  // Asks Meta to deliver the ownership verification code by SMS or voice call
  async requestCode(
    credentials: GraphCredentials,
    phoneNumberId: string,
    dto: RequestPhoneVerificationCodeDto,
  ): Promise<SuccessResponseDto> {
    const { accessToken } = credentials;
    await this.metaGraph.post(accessToken, `/${phoneNumberId}/request_code`, {
      code_method: dto.codeMethod,
      language: dto.language ?? 'en_US',
    });
    return { success: true, message: 'Verification code requested.' };
  }

  // Confirms ownership of the number with the code Meta delivered
  async verifyCode(credentials: GraphCredentials, phoneNumberId: string, code: string): Promise<SuccessResponseDto> {
    const { accessToken } = credentials;
    await this.metaGraph.post(accessToken, `/${phoneNumberId}/verify_code`, { code });
    return { success: true, message: 'Phone number verified.' };
  }

  // Reads the number's business profile (picture, about, contact details) live from Meta
  async getProfile(credentials: GraphCredentials, phoneNumberId: string): Promise<WhatsappPhoneNumberProfileDto> {
    const { accessToken } = credentials;
    const response = await this.metaGraph.get<{ data: MetaGraphPhoneNumberProfile[] }>(
      accessToken,
      `/${phoneNumberId}/whatsapp_business_profile`,
      { fields: PROFILE_FIELDS },
    );
    return WhatsappPhoneNumberProfileDto.from(response.data?.[0] ?? {});
  }

  // Replaces the number's profile picture: resumable-uploads the image, then points the business
  // profile at the returned handle. Applies immediately — pictures are not reviewed
  async updateProfilePicture(
    credentials: GraphCredentials,
    phoneNumberId: string,
    imageBase64: string,
    mimeType: string,
  ): Promise<SuccessResponseDto> {
    const { accessToken } = credentials;

    const file = Buffer.from(imageBase64, 'base64');
    const handle = await this.metaGraph.uploadFile(accessToken, file, mimeType);

    await this.metaGraph.post(accessToken, `/${phoneNumberId}/whatsapp_business_profile`, {
      messaging_product: 'whatsapp',
      profile_picture_handle: handle,
    });

    this.logger.log(`Updated profile picture for phone number ${phoneNumberId} (account ${credentials.accountId})`);
    return { success: true, message: 'Profile picture updated.' };
  }

  // Submits a display name change to Meta for review (name_status tracks the outcome); once
  // approved, the number must be re-registered for the new name to take effect
  async requestNameChange(
    credentials: GraphCredentials,
    phoneNumberId: string,
    newDisplayName: string,
  ): Promise<SuccessResponseDto> {
    const { accessToken } = credentials;
    await this.metaGraph.post(accessToken, `/${phoneNumberId}`, { new_display_name: newDisplayName });

    this.logger.log(
      `Requested display name change for phone number ${phoneNumberId} (account ${credentials.accountId})`,
    );
    return { success: true, message: 'Name change submitted for Meta review.' };
  }

  // Registers the verified number for Cloud API messaging using the two-step PIN
  async register(credentials: GraphCredentials, phoneNumberId: string, pin: string): Promise<SuccessResponseDto> {
    const { accessToken } = credentials;
    await this.metaGraph.post(accessToken, `/${phoneNumberId}/register`, {
      messaging_product: 'whatsapp',
      pin,
    });
    this.logger.log(`Registered phone number ${phoneNumberId} for Cloud API (account ${credentials.accountId})`);
    return { success: true, message: 'Phone number registered for messaging.' };
  }
}
