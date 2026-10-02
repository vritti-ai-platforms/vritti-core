import { ApiUpsertAppChannel } from '@commerce/catalog-channels/docs/app-catalog-channel-gateway.docs';
import { UpsertAppChannelDto } from '@commerce/catalog-channels/dto/request/app-channel.dto';
import type { CatalogChannelResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import { Body, Controller, Logger, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import { LE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LeAppCatalogChannelGatewayService } from './services/app-catalog-channel-gateway.service';

@ApiTags('Commerce - Catalog Channels')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_CATALOG_CHANNELS.featureCode)
@Controller('le/catalog-channels/app')
export class LeAppCatalogChannelGatewayController {
  private readonly logger = new Logger(LeAppCatalogChannelGatewayController.name);

  constructor(private readonly service: LeAppCatalogChannelGatewayService) {}

  @Put()
  @RequirePermission(LE_CATALOG_CHANNELS.edit)
  @ApiUpsertAppChannel()
  upsert(@Body() dto: UpsertAppChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('PUT /commerce-api/le/catalog-channels/app');
    return this.service.upsert(dto);
  }
}
