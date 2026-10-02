import {
  ApiUpsertB2bChannel,
  ApiUpsertPosChannel,
} from '@commerce/catalog-channels/docs/app-catalog-channel-gateway.docs';
import {
  ApiChannelItems,
  ApiDeleteChannel,
  ApiListCatalogChannels,
  ApiSetChannelItemVisibility,
} from '@commerce/catalog-channels/docs/catalog-channels-gateway.docs';
import { UpsertB2bChannelDto, UpsertPosChannelDto } from '@commerce/catalog-channels/dto/request/app-channel.dto';
import { SetItemVisibilityDto } from '@commerce/catalog-channels/dto/request/set-item-visibility.dto';
import type {
  CatalogChannelResponseDto,
  ChannelEntryResponseDto,
} from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type { ChannelItemTableResponseDto } from '@commerce/catalog-channels/dto/response/channel-item-response.dto';
import { Body, Controller, Delete, Get, Logger, Param, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { SiteCatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

@ApiTags('Commerce - Catalog Channels')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_CATALOG_CHANNELS.featureCode)
@Controller('site/catalog-channels')
export class SiteCatalogChannelsGatewayController {
  private readonly logger = new Logger(SiteCatalogChannelsGatewayController.name);

  constructor(private readonly service: SiteCatalogChannelsGatewayService) {}

  // The whole list: each type's default plus every app / terminal under it
  @Get()
  @RequirePermission(SITE_CATALOG_CHANNELS.view)
  @ApiListCatalogChannels()
  list(@OrgId() orgId: string): Promise<ChannelEntryResponseDto[]> {
    this.logger.log('GET /commerce-api/site/catalog-channels');
    return this.service.list(orgId);
  }

  // Creation is per type because each names a different target; everything after it keys on channelId
  @Put('pos')
  @RequirePermission(SITE_CATALOG_CHANNELS.edit)
  @ApiUpsertPosChannel()
  upsertPos(@Body() dto: UpsertPosChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('PUT /commerce-api/site/catalog-channels/pos');
    return this.service.upsertPos(dto);
  }

  @Put('b2b')
  @RequirePermission(SITE_CATALOG_CHANNELS.edit)
  @ApiUpsertB2bChannel()
  upsertB2b(@Body() dto: UpsertB2bChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('PUT /commerce-api/site/catalog-channels/b2b');
    return this.service.upsertB2b(dto);
  }

  @Get(':channelId/items/table')
  @RequirePermission(SITE_CATALOG_CHANNELS.view)
  @ApiChannelItems()
  findItemsForTable(
    @UserId() userId: string,
    @Param('channelId') channelId: string,
  ): Promise<ChannelItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/catalog-channels/${channelId}/items/table`);
    return this.service.findItemsForTable(userId, channelId);
  }

  @Patch(':channelId/items/:listingId')
  @RequirePermission(SITE_CATALOG_CHANNELS.edit)
  @ApiSetChannelItemVisibility()
  setItemVisibility(
    @Param('channelId') channelId: string,
    @Param('listingId') listingId: string,
    @Body() dto: SetItemVisibilityDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/catalog-channels/${channelId}/items/${listingId}`);
    return this.service.setItemVisibility(channelId, listingId, dto.sellsHere);
  }

  @Delete(':channelId')
  @RequirePermission(SITE_CATALOG_CHANNELS.edit)
  @ApiDeleteChannel()
  remove(@Param('channelId') channelId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/catalog-channels/${channelId}`);
    return this.service.remove(channelId);
  }
}
