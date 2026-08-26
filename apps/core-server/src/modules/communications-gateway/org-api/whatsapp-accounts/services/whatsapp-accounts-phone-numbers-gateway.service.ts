import type { CreateWhatsappPhoneNumberDto } from '@communications/whatsapp-account-phone-numbers/dto/request/create-whatsapp-phone-number.dto';
import type { RequestPhoneVerificationCodeDto } from '@communications/whatsapp-account-phone-numbers/dto/request/request-phone-verification-code.dto';
import type { UpdatePhoneNumberProfilePictureDto } from '@communications/whatsapp-account-phone-numbers/dto/request/update-phone-number-profile-picture.dto';
import type { WhatsappPhoneNumberProfileResponseDto } from '@communications/whatsapp-account-phone-numbers/dto/response/whatsapp-phone-number-profile-response.dto';
import type { WhatsappPhoneNumberResponseDto } from '@communications/whatsapp-account-phone-numbers/dto/response/whatsapp-phone-number-response.dto';
import type { WhatsappPhoneNumberTableResponseDto } from '@communications/whatsapp-account-phone-numbers/dto/response/whatsapp-phone-number-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class WhatsappAccountsPhoneNumbersGatewayService {
  private readonly logger = new Logger(WhatsappAccountsPhoneNumbersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns the WABA's phone numbers as a data table. The rows come live from Meta — the state
  // round-trip only carries column visibility etc.; Meta cannot sort or filter this list
  async findForTable(userId: string, accountId: string): Promise<WhatsappPhoneNumberTableResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.list — account: ${accountId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'communications-org-whatsapp-phone-numbers',
    );

    const result = await this.nats.send<WhatsappPhoneNumberResponseDto[]>(
      'communications',
      'org.whatsappAccounts.phoneNumbers.list',
      { accountId },
    );

    return { result, count: result.length, state, activeViewId };
  }

  // Adds a phone number to the WABA
  create(
    accountId: string,
    dto: CreateWhatsappPhoneNumberDto,
  ): Promise<CreateResponseDto<WhatsappPhoneNumberResponseDto>> {
    this.logger.log(`whatsappAccounts.phoneNumbers.create — account: ${accountId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.phoneNumbers.create', { accountId, ...dto });
  }

  // Requests the ownership verification code for a number
  requestCode(
    accountId: string,
    phoneNumberId: string,
    dto: RequestPhoneVerificationCodeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.requestCode — number: ${phoneNumberId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.phoneNumbers.requestCode', {
      accountId,
      phoneNumberId,
      ...dto,
    });
  }

  // Confirms ownership of a number with the delivered code
  verifyCode(accountId: string, phoneNumberId: string, code: string): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.verifyCode — number: ${phoneNumberId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.phoneNumbers.verifyCode', {
      accountId,
      phoneNumberId,
      code,
    });
  }

  // Reads the number's business profile live from Meta
  getProfile(accountId: string, phoneNumberId: string): Promise<WhatsappPhoneNumberProfileResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.getProfile — number: ${phoneNumberId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.phoneNumbers.getProfile', {
      accountId,
      phoneNumberId,
    });
  }

  // Replaces the number's profile picture
  updateProfilePicture(
    accountId: string,
    phoneNumberId: string,
    dto: UpdatePhoneNumberProfilePictureDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.updateProfilePicture — number: ${phoneNumberId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.phoneNumbers.updateProfilePicture', {
      accountId,
      phoneNumberId,
      ...dto,
    });
  }

  // Submits a display name change to Meta for review
  requestNameChange(accountId: string, phoneNumberId: string, newDisplayName: string): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.requestNameChange — number: ${phoneNumberId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.phoneNumbers.requestNameChange', {
      accountId,
      phoneNumberId,
      newDisplayName,
    });
  }

  // Registers a verified number for Cloud API messaging
  register(accountId: string, phoneNumberId: string, pin: string): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.register — number: ${phoneNumberId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.phoneNumbers.register', {
      accountId,
      phoneNumberId,
      pin,
    });
  }
}
