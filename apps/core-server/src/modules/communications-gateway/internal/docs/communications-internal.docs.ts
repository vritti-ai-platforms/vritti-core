import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { SetOtpConfigDto } from '../dto/request/set-otp-config.dto';
import { TestOtpConfigDto } from '../dto/request/test-otp-config.dto';
import {
  OtpAccountOptionDto,
  OtpPhoneNumberOptionDto,
  OtpTemplateOptionDto,
} from '../dto/response/otp-option-response.dto';

export function ApiListOtpAccounts() {
  return applyDecorators(
    ApiOperation({
      summary: 'List WhatsApp accounts for OTP configuration',
      description: 'Active accounts connected to the signed organization. Feeds the cloud-web account selector.',
    }),
    ApiResponse({ status: 200, description: 'Accounts retrieved.', type: [OtpAccountOptionDto] }),
    ApiResponse({ status: 401, description: 'Invalid or missing cloud signature.' }),
  );
}

export function ApiListOtpPhoneNumbers() {
  return applyDecorators(
    ApiOperation({
      summary: 'List sender phone numbers for OTP configuration',
      description: 'Numbers registered on the account, read live from Meta.',
    }),
    ApiParam({ name: 'accountId', description: 'WhatsApp account ID' }),
    ApiResponse({ status: 200, description: 'Phone numbers retrieved.', type: [OtpPhoneNumberOptionDto] }),
    ApiResponse({ status: 401, description: 'Invalid or missing cloud signature.' }),
  );
}

export function ApiListOtpTemplates() {
  return applyDecorators(
    ApiOperation({
      summary: 'List usable templates for OTP configuration',
      description: 'Approved AUTHENTICATION templates only — no other category can carry a sign-in code.',
    }),
    ApiParam({ name: 'accountId', description: 'WhatsApp account ID' }),
    ApiResponse({ status: 200, description: 'Templates retrieved.', type: [OtpTemplateOptionDto] }),
    ApiResponse({ status: 401, description: 'Invalid or missing cloud signature.' }),
  );
}

export function ApiGetOtpConfig() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get an app OTP configuration',
      description: 'Returns the stored configuration, or null when the app has never been set up to send codes.',
    }),
    ApiParam({ name: 'appId', description: 'App credential ID' }),
    ApiResponse({ status: 200, description: 'Configuration retrieved.' }),
    ApiResponse({ status: 404, description: 'App not found.' }),
  );
}

export function ApiSetOtpConfig() {
  return applyDecorators(
    ApiOperation({
      summary: 'Set an app OTP configuration',
      description:
        'Validates the account, sender, and template against Meta before storing, so a broken configuration fails here rather than at send time.',
    }),
    ApiParam({ name: 'appId', description: 'App credential ID' }),
    ApiBody({ type: SetOtpConfigDto }),
    ApiResponse({ status: 200, description: 'Configuration stored.' }),
    ApiResponse({ status: 400, description: 'Unknown account, sender, or unusable template.' }),
    ApiResponse({ status: 404, description: 'App not found.' }),
  );
}

export function ApiClearOtpConfig() {
  return applyDecorators(
    ApiOperation({
      summary: 'Turn off WhatsApp sign-in codes for an app',
      description: 'Clears the stored configuration. Codes already in flight remain verifiable until they expire.',
    }),
    ApiParam({ name: 'appId', description: 'App credential ID' }),
    ApiResponse({ status: 200, description: 'Configuration cleared.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'App not found.' }),
  );
}

export function ApiTestOtpConfig() {
  return applyDecorators(
    ApiOperation({
      summary: 'Send a test sign-in code',
      description:
        "Issues a real, billable code to the given number using the app's stored configuration, exercising the same path a storefront uses.",
    }),
    ApiParam({ name: 'appId', description: 'App credential ID' }),
    ApiBody({ type: TestOtpConfigDto }),
    ApiResponse({ status: 200, description: 'Send attempted; `sent` reports the outcome.' }),
    ApiResponse({ status: 400, description: 'No configuration stored for this app.' }),
  );
}
