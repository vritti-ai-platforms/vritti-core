import { WhatsappPhoneNumberDto } from '@domain/whatsapp-account-phone-numbers/dto/entity/whatsapp-phone-number.dto';
import { WhatsappPhoneNumberProfileDto } from '@domain/whatsapp-account-phone-numbers/dto/entity/whatsapp-phone-number-profile.dto';
import { CreateWhatsappPhoneNumberDto } from '@domain/whatsapp-account-phone-numbers/dto/request/create-whatsapp-phone-number.dto';
import { RequestPhoneVerificationCodeDto } from '@domain/whatsapp-account-phone-numbers/dto/request/request-phone-verification-code.dto';
import { WhatsappAccountPhoneNumbersDomainService } from '@domain/whatsapp-account-phone-numbers/services/whatsapp-account-phone-numbers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class WhatsappAccountsPhoneNumbersController {
  private readonly logger = new Logger(WhatsappAccountsPhoneNumbersController.name);

  constructor(private readonly service: WhatsappAccountPhoneNumbersDomainService) {}

  @MessagePattern({ cmd: 'org.whatsappAccounts.phoneNumbers.list' })
  async list(@Payload() data: { accountId: string }): Promise<WhatsappPhoneNumberDto[]> {
    this.logger.log(`whatsappAccounts.phoneNumbers.list — account: ${data.accountId}`);
    return this.service.list(data.accountId);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.phoneNumbers.create' })
  async create(
    @Payload() data: { accountId: string } & CreateWhatsappPhoneNumberDto,
  ): Promise<CreateResponseDto<WhatsappPhoneNumberDto>> {
    const { accountId, ...dto } = data;
    this.logger.log(`whatsappAccounts.phoneNumbers.create — account: ${accountId}`);
    return this.service.create(accountId, dto);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.phoneNumbers.requestCode' })
  async requestCode(
    @Payload() data: { accountId: string; phoneNumberId: string } & RequestPhoneVerificationCodeDto,
  ): Promise<SuccessResponseDto> {
    const { accountId, phoneNumberId, ...dto } = data;
    this.logger.log(`whatsappAccounts.phoneNumbers.requestCode — number: ${phoneNumberId}`);
    return this.service.requestCode(accountId, phoneNumberId, dto);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.phoneNumbers.verifyCode' })
  async verifyCode(
    @Payload() data: { accountId: string; phoneNumberId: string; code: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.verifyCode — number: ${data.phoneNumberId}`);
    return this.service.verifyCode(data.accountId, data.phoneNumberId, data.code);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.phoneNumbers.register' })
  async register(
    @Payload() data: { accountId: string; phoneNumberId: string; pin: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.register — number: ${data.phoneNumberId}`);
    return this.service.register(data.accountId, data.phoneNumberId, data.pin);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.phoneNumbers.getProfile' })
  async getProfile(
    @Payload() data: { accountId: string; phoneNumberId: string },
  ): Promise<WhatsappPhoneNumberProfileDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.getProfile — number: ${data.phoneNumberId}`);
    return this.service.getProfile(data.accountId, data.phoneNumberId);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.phoneNumbers.updateProfilePicture' })
  async updateProfilePicture(
    @Payload() data: { accountId: string; phoneNumberId: string; imageBase64: string; mimeType: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.updateProfilePicture — number: ${data.phoneNumberId}`);
    return this.service.updateProfilePicture(data.accountId, data.phoneNumberId, data.imageBase64, data.mimeType);
  }

  @MessagePattern({ cmd: 'org.whatsappAccounts.phoneNumbers.requestNameChange' })
  async requestNameChange(
    @Payload() data: { accountId: string; phoneNumberId: string; newDisplayName: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.phoneNumbers.requestNameChange — number: ${data.phoneNumberId}`);
    return this.service.requestNameChange(data.accountId, data.phoneNumberId, data.newDisplayName);
  }
}
