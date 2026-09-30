import { ApiCreateAppChannel } from '@commerce/catalog-channels/docs/app-catalog-channel-gateway.docs';
import { CreateAppChannelDto } from '@commerce/catalog-channels/dto/request/app-channel.dto';
import type { CatalogChannelResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(LE_CATALOG_CHANNELS.edit)
  @ApiCreateAppChannel()
  create(@Body() dto: CreateAppChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('POST /commerce-api/le/catalog-channels/app');
    return this.service.create(dto);
  }
}
