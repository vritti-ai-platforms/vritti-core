import type { WhatsappPhoneNumberDto } from '@domain/whatsapp-account-phone-numbers/dto/entity/whatsapp-phone-number.dto';
import type { WhatsappPhoneNumberProfileDto } from '@domain/whatsapp-account-phone-numbers/dto/entity/whatsapp-phone-number-profile.dto';
import type { CreateWhatsappPhoneNumberDto } from '@domain/whatsapp-account-phone-numbers/dto/request/create-whatsapp-phone-number.dto';
import type { RequestPhoneVerificationCodeDto } from '@domain/whatsapp-account-phone-numbers/dto/request/request-phone-verification-code.dto';
import {
  type GraphCredentials,
  WhatsappAccountPhoneNumbersDomainService,
} from '@domain/whatsapp-account-phone-numbers/services/whatsapp-account-phone-numbers.service';
import { WhatsappAccountsDomainService } from '@domain/whatsapp-accounts/services/whatsapp-accounts.service';
import { Injectable } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

// Resolves the account's Graph credentials and hands them to the phone-numbers domain, which owns no
// account lookup of its own — domain modules never import each other.
@Injectable()
export class WhatsappPhoneNumbersService {
  constructor(
    private readonly accountsService: WhatsappAccountsDomainService,
    private readonly phoneNumbersService: WhatsappAccountPhoneNumbersDomainService,
  ) {}

  // Lists the WABA's phone numbers
  async list(accountId: string): Promise<WhatsappPhoneNumberDto[]> {
    return this.phoneNumbersService.list(await this.credentials(accountId));
  }

  // Adds a phone number to the WABA
  async create(
    accountId: string,
    dto: CreateWhatsappPhoneNumberDto,
  ): Promise<CreateResponseDto<WhatsappPhoneNumberDto>> {
    return this.phoneNumbersService.create(await this.credentials(accountId), dto);
  }

  // Requests the ownership verification code for a number
  async requestCode(
    accountId: string,
    phoneNumberId: string,
    dto: RequestPhoneVerificationCodeDto,
  ): Promise<SuccessResponseDto> {
    return this.phoneNumbersService.requestCode(await this.credentials(accountId), phoneNumberId, dto);
  }

  // Confirms ownership of a number with the delivered code
  async verifyCode(accountId: string, phoneNumberId: string, code: string): Promise<SuccessResponseDto> {
    return this.phoneNumbersService.verifyCode(await this.credentials(accountId), phoneNumberId, code);
  }

  // Reads the number's business profile live from Meta
  async getProfile(accountId: string, phoneNumberId: string): Promise<WhatsappPhoneNumberProfileDto> {
    return this.phoneNumbersService.getProfile(await this.credentials(accountId), phoneNumberId);
  }

  // Replaces the number's profile picture
  async updateProfilePicture(
    accountId: string,
    phoneNumberId: string,
    imageBase64: string,
    mimeType: string,
  ): Promise<SuccessResponseDto> {
    return this.phoneNumbersService.updateProfilePicture(
      await this.credentials(accountId),
      phoneNumberId,
      imageBase64,
      mimeType,
    );
  }

  // Submits a display name change to Meta for review
  async requestNameChange(
    accountId: string,
    phoneNumberId: string,
    newDisplayName: string,
  ): Promise<SuccessResponseDto> {
    return this.phoneNumbersService.requestNameChange(await this.credentials(accountId), phoneNumberId, newDisplayName);
  }

  // Registers a verified number for Cloud API messaging
  async register(accountId: string, phoneNumberId: string, pin: string): Promise<SuccessResponseDto> {
    return this.phoneNumbersService.register(await this.credentials(accountId), phoneNumberId, pin);
  }

  private async credentials(accountId: string): Promise<GraphCredentials> {
    return { accountId, ...(await this.accountsService.resolveGraphCredentials(accountId)) };
  }
}
