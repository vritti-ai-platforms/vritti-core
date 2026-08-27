import type { ConfiguredOtpAppResponseDto } from '@communications/whatsapp-otps/dto/response/whatsapp-otp-response.dto';
import type { WhatsappOtpStatsResponseDto } from '@communications/whatsapp-otps/dto/response/whatsapp-otp-stats-response.dto';
import type { WhatsappOtpTableResponseDto } from '@communications/whatsapp-otps/dto/response/whatsapp-otp-table-response.dto';
import { Controller, Get, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { ORG_WHATSAPP_OTPS } from '@vritti/communications-permissions/whatsapp-otps';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import {
  ApiGetConfiguredOtpApps,
  ApiGetWhatsappOtpStats,
  ApiGetWhatsappOtpsTable,
} from './docs/whatsapp-otps-gateway.docs';
import { WhatsappOtpsGatewayService } from './services/whatsapp-otps-gateway.service';

@ApiTags('Communications - WhatsApp OTPs')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_WHATSAPP_OTPS.featureCode)
@Controller('whatsapp-otps')
export class WhatsappOtpsGatewayController {
  private readonly logger = new Logger(WhatsappOtpsGatewayController.name);

  constructor(private readonly service: WhatsappOtpsGatewayService) {}

  // Returns the sign-in codes data table
  @Get('table')
  @RequirePermission(ORG_WHATSAPP_OTPS.view)
  @ApiGetWhatsappOtpsTable()
  getTable(@UserId() userId: string): Promise<WhatsappOtpTableResponseDto> {
    this.logger.log('GET /communications-api/whatsapp-otps/table');
    return this.service.findForTable(userId);
  }

  // Returns the aggregates behind the Overview tab
  @Get('stats')
  @RequirePermission(ORG_WHATSAPP_OTPS.stats.view)
  @ApiGetWhatsappOtpStats()
  getStats(): Promise<WhatsappOtpStatsResponseDto> {
    this.logger.log('GET /communications-api/whatsapp-otps/stats');
    return this.service.stats();
  }

  // Returns the apps set up to send sign-in codes
  @Get('configured-apps')
  @RequirePermission(ORG_WHATSAPP_OTPS.configuredApps.view)
  @ApiGetConfiguredOtpApps()
  getConfiguredApps(@OrgId() organizationId: string): Promise<ConfiguredOtpAppResponseDto[]> {
    this.logger.log('GET /communications-api/whatsapp-otps/configured-apps');
    return this.service.findConfiguredApps(organizationId);
  }
}
