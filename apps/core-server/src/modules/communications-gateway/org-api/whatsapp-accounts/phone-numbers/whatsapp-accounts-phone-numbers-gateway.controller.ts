import { CreateWhatsappPhoneNumberDto } from '@communications/whatsapp-account-phone-numbers/dto/request/create-whatsapp-phone-number.dto';
import { RegisterPhoneNumberDto } from '@communications/whatsapp-account-phone-numbers/dto/request/register-phone-number.dto';
import { RequestPhoneNumberNameChangeDto } from '@communications/whatsapp-account-phone-numbers/dto/request/request-phone-number-name-change.dto';
import { RequestPhoneVerificationCodeDto } from '@communications/whatsapp-account-phone-numbers/dto/request/request-phone-verification-code.dto';
import { UpdatePhoneNumberProfilePictureDto } from '@communications/whatsapp-account-phone-numbers/dto/request/update-phone-number-profile-picture.dto';
import { VerifyPhoneNumberCodeDto } from '@communications/whatsapp-account-phone-numbers/dto/request/verify-phone-number-code.dto';
import type { WhatsappPhoneNumberProfileResponseDto } from '@communications/whatsapp-account-phone-numbers/dto/response/whatsapp-phone-number-profile-response.dto';
import type { WhatsappPhoneNumberResponseDto } from '@communications/whatsapp-account-phone-numbers/dto/response/whatsapp-phone-number-response.dto';
import type { WhatsappPhoneNumberTableResponseDto } from '@communications/whatsapp-account-phone-numbers/dto/response/whatsapp-phone-number-table-response.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiCreateWhatsappPhoneNumber,
  ApiGetPhoneNumberProfile,
  ApiListWhatsappPhoneNumbers,
  ApiRegisterWhatsappPhoneNumber,
  ApiRequestPhoneNumberNameChange,
  ApiRequestPhoneVerificationCode,
  ApiUpdatePhoneNumberProfilePicture,
  ApiVerifyPhoneNumberCode,
} from '../docs/whatsapp-accounts-phone-numbers-gateway.docs';
import { WhatsappAccountsPhoneNumbersGatewayService } from '../services/whatsapp-accounts-phone-numbers-gateway.service';

// The :phoneNumberId params are Meta's numeric IDs, not UUIDs — only the account id gets the UUID pipe
@ApiTags('Communications - WhatsApp Phone Numbers')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_WHATSAPP_ACCOUNTS.featureCode)
@Controller('whatsapp-accounts/:id/phone-numbers')
export class WhatsappAccountsPhoneNumbersGatewayController {
  private readonly logger = new Logger(WhatsappAccountsPhoneNumbersGatewayController.name);

  constructor(private readonly service: WhatsappAccountsPhoneNumbersGatewayService) {}

  // Returns the WABA's phone numbers data table, rows read live from Meta
  @Get('table')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.phoneNumbers.view)
  @ApiListWhatsappPhoneNumbers()
  getTable(
    @UserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<WhatsappPhoneNumberTableResponseDto> {
    this.logger.log(`GET /communications-api/whatsapp-accounts/${id}/phone-numbers/table`);
    return this.service.findForTable(userId, id);
  }

  // Adds a phone number to the WABA
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.phoneNumbers.edit)
  @ApiCreateWhatsappPhoneNumber()
  create(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateWhatsappPhoneNumberDto,
  ): Promise<CreateResponseDto<WhatsappPhoneNumberResponseDto>> {
    this.logger.log(`POST /communications-api/whatsapp-accounts/${id}/phone-numbers`);
    return this.service.create(id, dto);
  }

  // Requests the ownership verification code (SMS or voice)
  @Post(':phoneNumberId/request-code')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.phoneNumbers.edit)
  @ApiRequestPhoneVerificationCode()
  requestCode(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('phoneNumberId') phoneNumberId: string,
    @Body() dto: RequestPhoneVerificationCodeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /communications-api/whatsapp-accounts/${id}/phone-numbers/${phoneNumberId}/request-code`);
    return this.service.requestCode(id, phoneNumberId, dto);
  }

  // Verifies the number with the delivered code
  @Post(':phoneNumberId/verify-code')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.phoneNumbers.edit)
  @ApiVerifyPhoneNumberCode()
  verifyCode(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('phoneNumberId') phoneNumberId: string,
    @Body() dto: VerifyPhoneNumberCodeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /communications-api/whatsapp-accounts/${id}/phone-numbers/${phoneNumberId}/verify-code`);
    return this.service.verifyCode(id, phoneNumberId, dto.code);
  }

  // Reads the number's business profile (picture, about, contact details) live from Meta
  @Get(':phoneNumberId/profile')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.phoneNumbers.view)
  @ApiGetPhoneNumberProfile()
  getProfile(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('phoneNumberId') phoneNumberId: string,
  ): Promise<WhatsappPhoneNumberProfileResponseDto> {
    this.logger.log(`GET /communications-api/whatsapp-accounts/${id}/phone-numbers/${phoneNumberId}/profile`);
    return this.service.getProfile(id, phoneNumberId);
  }

  // Replaces the number's profile picture (applies immediately — pictures are not reviewed)
  @Post(':phoneNumberId/profile-picture')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.phoneNumbers.edit)
  @ApiUpdatePhoneNumberProfilePicture()
  updateProfilePicture(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('phoneNumberId') phoneNumberId: string,
    @Body() dto: UpdatePhoneNumberProfilePictureDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /communications-api/whatsapp-accounts/${id}/phone-numbers/${phoneNumberId}/profile-picture`);
    return this.service.updateProfilePicture(id, phoneNumberId, dto);
  }

  // Submits a display name change to Meta for review
  @Post(':phoneNumberId/request-name-change')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.phoneNumbers.edit)
  @ApiRequestPhoneNumberNameChange()
  requestNameChange(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('phoneNumberId') phoneNumberId: string,
    @Body() dto: RequestPhoneNumberNameChangeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `POST /communications-api/whatsapp-accounts/${id}/phone-numbers/${phoneNumberId}/request-name-change`,
    );
    return this.service.requestNameChange(id, phoneNumberId, dto.newDisplayName);
  }

  // Registers the verified number for Cloud API messaging
  @Post(':phoneNumberId/register')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.phoneNumbers.edit)
  @ApiRegisterWhatsappPhoneNumber()
  register(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('phoneNumberId') phoneNumberId: string,
    @Body() dto: RegisterPhoneNumberDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /communications-api/whatsapp-accounts/${id}/phone-numbers/${phoneNumberId}/register`);
    return this.service.register(id, phoneNumberId, dto.pin);
  }
}
