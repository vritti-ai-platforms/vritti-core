import { ApiCatalogChannelsOverview } from '@commerce/catalog-channels/docs/catalog-channels-gateway.docs';
import type { ChannelOverviewResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import { Controller, Get, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LeCatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

@ApiTags('Commerce - Catalog Channels')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_CATALOG_CHANNELS.featureCode)
@Controller('le/catalog-channels')
export class LeCatalogChannelsGatewayController {
  private readonly logger = new Logger(LeCatalogChannelsGatewayController.name);

  constructor(private readonly service: LeCatalogChannelsGatewayService) {}

  @Get()
  @RequirePermission(ORG_CATALOG_CHANNELS.view)
  @ApiCatalogChannelsOverview()
  overview(): Promise<ChannelOverviewResponseDto[]> {
    this.logger.log('GET /commerce-api/le/catalog-channels');
    return this.service.overview();
  }
}
