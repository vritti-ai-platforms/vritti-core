import {
  ApiUpsertAppChannel,
  ApiUpsertB2bChannel,
  ApiUpsertPosChannel,
} from '@commerce/catalog-channels/docs/app-catalog-channel-gateway.docs';
import {
  ApiChannelCurrencies,
  ApiChannelItems,
  ApiChannelPrices,
  ApiDeleteChannel,
  ApiListCatalogChannels,
  ApiSetChannelItemVisibility,
} from '@commerce/catalog-channels/docs/catalog-channels-gateway.docs';
import {
  UpsertAppChannelDto,
  UpsertB2bChannelDto,
  UpsertPosChannelDto,
} from '@commerce/catalog-channels/dto/request/app-channel.dto';
import { SetItemVisibilityDto } from '@commerce/catalog-channels/dto/request/set-item-visibility.dto';
import type {
  CatalogChannelResponseDto,
  ChannelEntryResponseDto,
} from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type {
  ChannelItemTableResponseDto,
  ChannelPriceTableResponseDto,
} from '@commerce/catalog-channels/dto/response/channel-item-response.dto';
import { Body, Controller, Delete, Get, Logger, Param, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { LE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { LeCatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

@ApiTags('Commerce - Catalog Channels')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_CATALOG_CHANNELS.featureCode)
@Controller('le/catalog-channels')
export class LeCatalogChannelsGatewayController {
  private readonly logger = new Logger(LeCatalogChannelsGatewayController.name);

  constructor(private readonly service: LeCatalogChannelsGatewayService) {}

  // The whole list: each type's default plus every app / terminal under it
  @Get()
  @RequirePermission(LE_CATALOG_CHANNELS.view)
  @ApiListCatalogChannels()
  list(@OrgId() orgId: string): Promise<ChannelEntryResponseDto[]> {
    this.logger.log('GET /commerce-api/le/catalog-channels');
    return this.service.list(orgId);
  }

  // Creation is per type because each names a different target; everything after it keys on channelId
  @Put('app')
  @RequirePermission(LE_CATALOG_CHANNELS.edit)
  @ApiUpsertAppChannel()
  upsertApp(@Body() dto: UpsertAppChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('PUT /commerce-api/le/catalog-channels/app');
    return this.service.upsertApp(dto);
  }

  @Put('pos')
  @RequirePermission(LE_CATALOG_CHANNELS.edit)
  @ApiUpsertPosChannel()
  upsertPos(@Body() dto: UpsertPosChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('PUT /commerce-api/le/catalog-channels/pos');
    return this.service.upsertPos(dto);
  }

  @Put('b2b')
  @RequirePermission(LE_CATALOG_CHANNELS.edit)
  @ApiUpsertB2bChannel()
  upsertB2b(@Body() dto: UpsertB2bChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('PUT /commerce-api/le/catalog-channels/b2b');
    return this.service.upsertB2b(dto);
  }

  @Get(':channelId/listings/table')
  @RequirePermission(LE_CATALOG_CHANNELS.listings)
  @ApiChannelItems()
  findItemsForTable(
    @UserId() userId: string,
    @Param('channelId') channelId: string,
  ): Promise<ChannelItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/catalog-channels/${channelId}/listings/table`);
    return this.service.findItemsForTable(userId, channelId);
  }

  // The currencies this channel's catalog is priced in — the cards on its Prices tab
  @Get(':channelId/currencies')
  @RequirePermission(LE_CATALOG_CHANNELS.prices)
  @ApiChannelCurrencies()
  findCurrencies(@Param('channelId') channelId: string): Promise<string[]> {
    this.logger.log(`GET /commerce-api/le/catalog-channels/${channelId}/currencies`);
    return this.service.findCurrencies(channelId);
  }

  @Get(':channelId/currencies/:currencyCode/prices/table')
  @RequirePermission(LE_CATALOG_CHANNELS.prices)
  @ApiChannelPrices()
  findPricesForTable(
    @OrgId() orgId: string,
    @UserId() userId: string,
    @Param('channelId') channelId: string,
    @Param('currencyCode') currencyCode: string,
  ): Promise<ChannelPriceTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/catalog-channels/${channelId}/currencies/${currencyCode}/prices/table`);
    return this.service.findPricesForTable(orgId, userId, channelId, currencyCode);
  }

  @Patch(':channelId/listings/:listingId')
  @RequirePermission(LE_CATALOG_CHANNELS.setAvailability)
  @ApiSetChannelItemVisibility()
  setItemVisibility(
    @Param('channelId') channelId: string,
    @Param('listingId') listingId: string,
    @Body() dto: SetItemVisibilityDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/catalog-channels/${channelId}/listings/${listingId}`);
    return this.service.setItemVisibility(channelId, listingId, dto.availableHere, dto.currencyCode);
  }

  @Delete(':channelId')
  @RequirePermission(LE_CATALOG_CHANNELS.delete)
  @ApiDeleteChannel()
  remove(@Param('channelId') channelId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/catalog-channels/${channelId}`);
    return this.service.remove(channelId);
  }
}
