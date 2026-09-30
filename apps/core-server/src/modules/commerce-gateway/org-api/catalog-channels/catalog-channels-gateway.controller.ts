import {
  ApiCreateB2bChannel,
  ApiCreatePosChannel,
} from '@commerce/catalog-channels/docs/app-catalog-channel-gateway.docs';
import {
  ApiChannelItems,
  ApiChannelsScreen,
  ApiDeleteChannel,
  ApiSetChannelItemVisibility,
  ApiUpdateChannel,
} from '@commerce/catalog-channels/docs/catalog-channels-gateway.docs';
import {
  CreateB2bChannelDto,
  CreatePosChannelDto,
  UpdateAppChannelDto,
} from '@commerce/catalog-channels/dto/request/app-channel.dto';
import { SetItemVisibilityDto } from '@commerce/catalog-channels/dto/request/set-item-visibility.dto';
import type {
  CatalogChannelResponseDto,
  ChannelScreenEntryResponseDto,
} from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type { ChannelItemTableResponseDto } from '@commerce/catalog-channels/dto/response/channel-item-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { CatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

@ApiTags('Commerce - Catalog Channels')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_CATALOG_CHANNELS.featureCode)
@Controller('org/catalog-channels')
export class CatalogChannelsGatewayController {
  private readonly logger = new Logger(CatalogChannelsGatewayController.name);

  constructor(private readonly service: CatalogChannelsGatewayService) {}

  // The whole screen: each type's default plus every app / terminal under it
  @Get()
  @RequirePermission(ORG_CATALOG_CHANNELS.view)
  @ApiChannelsScreen()
  screen(@OrgId() orgId: string): Promise<ChannelScreenEntryResponseDto[]> {
    this.logger.log('GET /commerce-api/org/catalog-channels');
    return this.service.screen(orgId);
  }

  // Creation is per type because each names a different target; everything after it keys on channelId
  @Post('pos')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_CATALOG_CHANNELS.edit)
  @ApiCreatePosChannel()
  createPos(@Body() dto: CreatePosChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('POST /commerce-api/org/catalog-channels/pos');
    return this.service.createPos(dto);
  }

  @Post('b2b')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_CATALOG_CHANNELS.edit)
  @ApiCreateB2bChannel()
  createB2b(@Body() dto: CreateB2bChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('POST /commerce-api/org/catalog-channels/b2b');
    return this.service.createB2b(dto);
  }

  @Get(':channelId/items/table')
  @RequirePermission(ORG_CATALOG_CHANNELS.view)
  @ApiChannelItems()
  findItemsForTable(
    @UserId() userId: string,
    @Param('channelId') channelId: string,
  ): Promise<ChannelItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/org/catalog-channels/${channelId}/items/table`);
    return this.service.findItemsForTable(userId, channelId);
  }

  @Patch(':channelId/items/:listingId')
  @RequirePermission(ORG_CATALOG_CHANNELS.edit)
  @ApiSetChannelItemVisibility()
  setItemVisibility(
    @Param('channelId') channelId: string,
    @Param('listingId') listingId: string,
    @Body() dto: SetItemVisibilityDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/catalog-channels/${channelId}/items/${listingId}`);
    return this.service.setItemVisibility(channelId, listingId, dto.sellsHere);
  }

  @Patch(':channelId')
  @RequirePermission(ORG_CATALOG_CHANNELS.edit)
  @ApiUpdateChannel()
  update(@Param('channelId') channelId: string, @Body() dto: UpdateAppChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/catalog-channels/${channelId}`);
    return this.service.update(channelId, dto.catalogId);
  }

  @Delete(':channelId')
  @RequirePermission(ORG_CATALOG_CHANNELS.edit)
  @ApiDeleteChannel()
  remove(@Param('channelId') channelId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/catalog-channels/${channelId}`);
    return this.service.remove(channelId);
  }
}
