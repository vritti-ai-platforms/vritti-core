import { ApiCatalogChannelsOverview } from '@commerce/catalog-channels/docs/catalog-channels-gateway.docs';
import type { ChannelOverviewResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import { Controller, Get, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { CatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

@ApiTags('Commerce - Catalog Channels')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_CATALOG_CHANNELS.featureCode)
@Controller('org/catalog-channels')
export class CatalogChannelsGatewayController {
  private readonly logger = new Logger(CatalogChannelsGatewayController.name);

  constructor(private readonly service: CatalogChannelsGatewayService) {}

  @Get()
  @RequirePermission(ORG_CATALOG_CHANNELS.view)
  @ApiCatalogChannelsOverview()
  overview(): Promise<ChannelOverviewResponseDto[]> {
    this.logger.log('GET /commerce-api/org/catalog-channels');
    return this.service.overview();
  }
}
