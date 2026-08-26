import { CreateWhatsappPhoneNumberDto } from '@communications/whatsapp-account-phone-numbers/dto/request/create-whatsapp-phone-number.dto';
import { RegisterPhoneNumberDto } from '@communications/whatsapp-account-phone-numbers/dto/request/register-phone-number.dto';
import { RequestPhoneNumberNameChangeDto } from '@communications/whatsapp-account-phone-numbers/dto/request/request-phone-number-name-change.dto';
import { RequestPhoneVerificationCodeDto } from '@communications/whatsapp-account-phone-numbers/dto/request/request-phone-verification-code.dto';
import { UpdatePhoneNumberProfilePictureDto } from '@communications/whatsapp-account-phone-numbers/dto/request/update-phone-number-profile-picture.dto';
import { VerifyPhoneNumberCodeDto } from '@communications/whatsapp-account-phone-numbers/dto/request/verify-phone-number-code.dto';
import { WhatsappPhoneNumberProfileResponseDto } from '@communications/whatsapp-account-phone-numbers/dto/response/whatsapp-phone-number-profile-response.dto';
import { WhatsappPhoneNumberTableResponseDto } from '@communications/whatsapp-account-phone-numbers/dto/response/whatsapp-phone-number-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

export function ApiListWhatsappPhoneNumbers() {
  return applyDecorators(
    ApiOperation({
      summary: "Get the WABA's phone numbers table",
      description: 'Reads the numbers live from Meta — verification status and quality are always current.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiResponse({ status: 200, description: 'Phone numbers retrieved.', type: WhatsappPhoneNumberTableResponseDto }),
    ApiResponse({ status: 404, description: 'WhatsApp account not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateWhatsappPhoneNumber() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a phone number to the WABA',
      description:
        'Creates the number on the WABA in Meta. It must then be verified and registered before it can send.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiBody({ type: CreateWhatsappPhoneNumberDto }),
    ApiResponse({ status: 201, description: 'Phone number added.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Meta rejected the number or display name.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiRequestPhoneVerificationCode() {
  return applyDecorators(
    ApiOperation({
      summary: 'Request the ownership verification code',
      description: 'Meta delivers a 6-digit code to the number by SMS or voice call.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiParam({ name: 'phoneNumberId', description: 'Meta phone number ID' }),
    ApiBody({ type: RequestPhoneVerificationCodeDto }),
    ApiResponse({ status: 200, description: 'Verification code requested.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Meta rejected the request.' }),
  );
}

export function ApiVerifyPhoneNumberCode() {
  return applyDecorators(
    ApiOperation({ summary: 'Verify the phone number with the delivered code' }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiParam({ name: 'phoneNumberId', description: 'Meta phone number ID' }),
    ApiBody({ type: VerifyPhoneNumberCodeDto }),
    ApiResponse({ status: 200, description: 'Phone number verified.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The code is incorrect or expired.' }),
  );
}

export function ApiGetPhoneNumberProfile() {
  return applyDecorators(
    ApiOperation({
      summary: "Get the number's business profile",
      description: 'Reads the profile (picture, about, contact details) live from Meta.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiParam({ name: 'phoneNumberId', description: 'Meta phone number ID' }),
    ApiResponse({ status: 200, description: 'Profile retrieved.', type: WhatsappPhoneNumberProfileResponseDto }),
    ApiResponse({ status: 404, description: 'WhatsApp account not found.' }),
  );
}

export function ApiUpdatePhoneNumberProfilePicture() {
  return applyDecorators(
    ApiOperation({
      summary: "Replace the number's profile picture",
      description: 'Uploads the image to Meta and points the business profile at it. Applies immediately.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiParam({ name: 'phoneNumberId', description: 'Meta phone number ID' }),
    ApiBody({ type: UpdatePhoneNumberProfilePictureDto }),
    ApiResponse({ status: 200, description: 'Profile picture updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Meta rejected the image.' }),
  );
}

export function ApiRequestPhoneNumberNameChange() {
  return applyDecorators(
    ApiOperation({
      summary: 'Request a display name change',
      description:
        'Submits the new name to Meta for review (track via nameStatus). Once approved, re-register the number to apply it. Limited to 10 changes per 30 days.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiParam({ name: 'phoneNumberId', description: 'Meta phone number ID' }),
    ApiBody({ type: RequestPhoneNumberNameChangeDto }),
    ApiResponse({ status: 200, description: 'Name change submitted for review.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Meta rejected the name change request.' }),
  );
}

export function ApiRegisterWhatsappPhoneNumber() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register the verified number for Cloud API messaging',
      description: 'Requires the two-step verification PIN — set on first registration, matched afterwards.',
    }),
    ApiParam({ name: 'id', description: 'WhatsApp account ID' }),
    ApiParam({ name: 'phoneNumberId', description: 'Meta phone number ID' }),
    ApiBody({ type: RegisterPhoneNumberDto }),
    ApiResponse({ status: 200, description: 'Phone number registered.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Meta rejected the registration (e.g. wrong PIN).' }),
  );
}
