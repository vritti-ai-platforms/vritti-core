import { ConfiguredOtpAppResponseDto } from '@communications/whatsapp-otps/dto/response/whatsapp-otp-response.dto';
import { WhatsappOtpStatsResponseDto } from '@communications/whatsapp-otps/dto/response/whatsapp-otp-stats-response.dto';
import { WhatsappOtpTableResponseDto } from '@communications/whatsapp-otps/dto/response/whatsapp-otp-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetWhatsappOtpsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get WhatsApp OTPs table',
      description: 'Returns paginated, filtered, and sorted sign-in codes using server-stored table state.',
    }),
    ApiResponse({
      status: 200,
      description: 'WhatsApp OTPs table retrieved successfully.',
      type: WhatsappOtpTableResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetWhatsappOtpStats() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get WhatsApp OTP statistics',
      description: 'Aggregates the last 30 days of sign-in codes by status, day, and app credential.',
    }),
    ApiResponse({
      status: 200,
      description: 'WhatsApp OTP statistics retrieved successfully.',
      type: WhatsappOtpStatsResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetConfiguredOtpApps() {
  return applyDecorators(
    ApiOperation({
      summary: 'List apps configured to send sign-in codes',
      description: 'Reads the app rows, so an app configured but not yet used still appears.',
    }),
    ApiResponse({
      status: 200,
      description: 'Configured apps retrieved successfully.',
      type: [ConfiguredOtpAppResponseDto],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
