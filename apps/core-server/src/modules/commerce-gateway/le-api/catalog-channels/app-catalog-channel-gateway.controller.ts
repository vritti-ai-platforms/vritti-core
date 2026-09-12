import {
  ApiAppChannelItems,
  ApiAppChannels,
  ApiCreateAppChannel,
  ApiDeleteAppChannel,
  ApiSetAppChannelItemVisibility,
  ApiUpdateAppChannel,
} from '@commerce/catalog-channels/docs/app-catalog-channel-gateway.docs';
import { CreateAppChannelDto, UpdateAppChannelDto } from '@commerce/catalog-channels/dto/request/app-channel.dto';
import { SetItemVisibilityDto } from '@commerce/catalog-channels/dto/request/set-item-visibility.dto';
import type {
  CatalogChannelResponseDto,
  CatalogChannelTableResponseDto,
} from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type { ChannelItemTableResponseDto } from '@commerce/catalog-channels/dto/response/channel-item-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import { LeAppCatalogChannelGatewayService } from './services/app-catalog-channel-gateway.service';

@ApiTags('Commerce - App Catalog Channel')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_CATALOG_CHANNELS.featureCode)
@Controller('le/catalog-channels/app')
export class LeAppCatalogChannelGatewayController {
  private readonly logger = new Logger(LeAppCatalogChannelGatewayController.name);

  constructor(private readonly service: LeAppCatalogChannelGatewayService) {}

  @Get('table')
  @RequirePermission(ORG_CATALOG_CHANNELS.view)
  @ApiAppChannels()
  findForTable(@UserId() userId: string, @OrgId() orgId: string): Promise<CatalogChannelTableResponseDto> {
    this.logger.log('GET /commerce-api/le/catalog-channels/app/table');
    return this.service.findForTable(userId, orgId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_CATALOG_CHANNELS.edit)
  @ApiCreateAppChannel()
  create(@Body() dto: CreateAppChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('POST /commerce-api/le/catalog-channels/app');
    return this.service.create(dto);
  }

  @Patch(':channelId')
  @RequirePermission(ORG_CATALOG_CHANNELS.edit)
  @ApiUpdateAppChannel()
  update(@Param('channelId') channelId: string, @Body() dto: UpdateAppChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/catalog-channels/app/${channelId}`);
    return this.service.update(channelId, dto);
  }

  @Delete(':channelId')
  @RequirePermission(ORG_CATALOG_CHANNELS.edit)
  @ApiDeleteAppChannel()
  remove(@Param('channelId') channelId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/le/catalog-channels/app/${channelId}`);
    return this.service.remove(channelId);
  }

  @Get(':channelId/items/table')
  @RequirePermission(ORG_CATALOG_CHANNELS.view)
  @ApiAppChannelItems()
  findItemsForTable(
    @UserId() userId: string,
    @Param('channelId') channelId: string,
  ): Promise<ChannelItemTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/catalog-channels/app/${channelId}/items/table`);
    return this.service.findItemsForTable(userId, channelId);
  }

  @Patch(':channelId/items/:listingId')
  @RequirePermission(ORG_CATALOG_CHANNELS.edit)
  @ApiSetAppChannelItemVisibility()
  setItemVisibility(
    @Param('channelId') channelId: string,
    @Param('listingId') listingId: string,
    @Body() dto: SetItemVisibilityDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/le/catalog-channels/app/${channelId}/items/${listingId}`);
    return this.service.setItemVisibility(channelId, listingId, dto.sellsHere);
  }
}
