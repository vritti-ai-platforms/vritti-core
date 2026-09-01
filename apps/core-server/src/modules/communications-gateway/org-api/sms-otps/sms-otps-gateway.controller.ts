import type { ConfiguredSmsOtpAppResponseDto } from '@communications/sms-otps/dto/response/sms-otp-response.dto';
import type { SmsOtpStatsResponseDto } from '@communications/sms-otps/dto/response/sms-otp-stats-response.dto';
import type { SmsOtpTableResponseDto } from '@communications/sms-otps/dto/response/sms-otp-table-response.dto';
import { Controller, Get, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { ORG_SMS_OTPS } from '@vritti/communications-permissions/sms-otps';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { ApiGetConfiguredSmsOtpApps, ApiGetSmsOtpStats, ApiGetSmsOtpsTable } from './docs/sms-otps-gateway.docs';
import { SmsOtpsGatewayService } from './services/sms-otps-gateway.service';

@ApiTags('Communications - SMS OTPs')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_SMS_OTPS.featureCode)
@Controller('sms-otps')
export class SmsOtpsGatewayController {
  private readonly logger = new Logger(SmsOtpsGatewayController.name);

  constructor(private readonly service: SmsOtpsGatewayService) {}

  // Returns the sign-in codes data table
  @Get('table')
  @RequirePermission(ORG_SMS_OTPS.view)
  @ApiGetSmsOtpsTable()
  getTable(@UserId() userId: string): Promise<SmsOtpTableResponseDto> {
    this.logger.log('GET /communications-api/sms-otps/table');
    return this.service.findForTable(userId);
  }

  // Returns the aggregates behind the Overview tab
  @Get('stats')
  @RequirePermission(ORG_SMS_OTPS.stats.view)
  @ApiGetSmsOtpStats()
  getStats(): Promise<SmsOtpStatsResponseDto> {
    this.logger.log('GET /communications-api/sms-otps/stats');
    return this.service.stats();
  }

  // Returns the apps set up to send SMS sign-in codes
  @Get('configured-apps')
  @RequirePermission(ORG_SMS_OTPS.configuredApps.view)
  @ApiGetConfiguredSmsOtpApps()
  getConfiguredApps(@OrgId() organizationId: string): Promise<ConfiguredSmsOtpAppResponseDto[]> {
    this.logger.log('GET /communications-api/sms-otps/configured-apps');
    return this.service.findConfiguredApps(organizationId);
  }
}
