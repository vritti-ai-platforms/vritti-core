import {
  ApiCatalogChannelsTable,
  ApiCreateCatalogChannel,
  ApiDeleteCatalogChannel,
  ApiRepointCatalogChannel,
  ApiResolveCatalogChannel,
} from '@commerce/catalog-channels/docs/catalog-channels-gateway.docs';
import {
  CreateCatalogChannelDto,
  RepointCatalogChannelDto,
} from '@commerce/catalog-channels/dto/request/create-catalog-channel.dto';
import { ResolveCatalogChannelQueryDto } from '@commerce/catalog-channels/dto/request/resolve-catalog-channel-query.dto';
import type {
  CatalogChannelResponseDto,
  ResolvedCatalogResponseDto,
} from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type { CatalogChannelTableResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
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

  @Get('table')
  @RequirePermission(ORG_CATALOG_CHANNELS.view)
  @ApiCatalogChannelsTable()
  getTable(@UserId() userId: string): Promise<CatalogChannelTableResponseDto> {
    this.logger.log('GET /commerce-api/org/catalog-channels/table');
    return this.service.findForTable(userId);
  }

  // Diagnostic: which catalog would this channel resolve to, and why. Declared before :id.
  @Get('resolve')
  @RequirePermission(ORG_CATALOG_CHANNELS.view)
  @ApiResolveCatalogChannel()
  resolve(@Query() query: ResolveCatalogChannelQueryDto): Promise<ResolvedCatalogResponseDto> {
    this.logger.log(`GET /commerce-api/org/catalog-channels/resolve — type: ${query.type}`);
    return this.service.resolve(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_CATALOG_CHANNELS.add)
  @ApiCreateCatalogChannel()
  create(@Body() dto: CreateCatalogChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log('POST /commerce-api/org/catalog-channels');
    return this.service.create(dto);
  }

  // Repointing is the common edit — scope and target are fixed once a channel exists
  @Patch(':id')
  @RequirePermission(ORG_CATALOG_CHANNELS.edit)
  @ApiRepointCatalogChannel()
  repoint(@Param('id') id: string, @Body() dto: RepointCatalogChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/catalog-channels/${id}`);
    return this.service.repoint(id, dto);
  }

  @Delete(':id')
  @RequirePermission(ORG_CATALOG_CHANNELS.delete)
  @ApiDeleteCatalogChannel()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/catalog-channels/${id}`);
    return this.service.delete(id);
  }
}
