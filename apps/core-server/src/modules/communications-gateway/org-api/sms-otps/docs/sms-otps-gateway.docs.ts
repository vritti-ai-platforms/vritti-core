import { ConfiguredSmsOtpAppResponseDto } from '@communications/sms-otps/dto/response/sms-otp-response.dto';
import { SmsOtpStatsResponseDto } from '@communications/sms-otps/dto/response/sms-otp-stats-response.dto';
import { SmsOtpTableResponseDto } from '@communications/sms-otps/dto/response/sms-otp-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetSmsOtpsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get the SMS sign-in codes table',
      description: 'Issued codes with derived status — codes themselves are never stored or returned.',
    }),
    ApiResponse({ status: 200, description: 'Codes retrieved.', type: SmsOtpTableResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetSmsOtpStats() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get SMS OTP statistics',
      description: 'Last-30-day aggregates behind the Overview tab: tiles, daily series, per-app breakdown.',
    }),
    ApiResponse({ status: 200, description: 'Statistics retrieved.', type: SmsOtpStatsResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetConfiguredSmsOtpApps() {
  return applyDecorators(
    ApiOperation({
      summary: 'List apps configured for SMS sign-in codes',
      description: 'Read from the app rows, so it reflects configuration rather than traffic.',
    }),
    ApiResponse({ status: 200, description: 'Apps retrieved.', type: [ConfiguredSmsOtpAppResponseDto] }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
