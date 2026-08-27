import { CreateSalesChannelDto } from '@commerce/sales-channels/dto/request/create-sales-channel.dto';
import { UpdateSalesChannelDto } from '@commerce/sales-channels/dto/request/update-sales-channel.dto';
import type { SalesChannelResponseDto } from '@commerce/sales-channels/dto/response/sales-channel-response.dto';
import type { SalesChannelTableResponseDto } from '@commerce/sales-channels/dto/response/sales-channel-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_SALES_CHANNELS } from '@vritti/commerce-permissions/sales-channels';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { SalesChannelsGatewayService } from './services/sales-channels-gateway.service';

@ApiTags('Commerce - Sales Channels')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_SALES_CHANNELS.featureCode)
@Controller('sales-channels')
export class SalesChannelsGatewayController {
  private readonly logger = new Logger(SalesChannelsGatewayController.name);

  constructor(private readonly service: SalesChannelsGatewayService) {}

  @Get('table')
  @RequirePermission(ORG_SALES_CHANNELS.view)
  getTable(@UserId() userId: string): Promise<SalesChannelTableResponseDto> {
    this.logger.log('GET /commerce-api/sales-channels/table');
    return this.service.findForTable(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_SALES_CHANNELS.add)
  create(@Body() dto: CreateSalesChannelDto): Promise<CreateResponseDto<SalesChannelResponseDto>> {
    this.logger.log('POST /commerce-api/sales-channels');
    return this.service.create(dto);
  }

  @Get(':id')
  @RequirePermission(ORG_SALES_CHANNELS.view)
  findById(@Param('id') id: string): Promise<SalesChannelResponseDto> {
    this.logger.log(`GET /commerce-api/sales-channels/${id}`);
    return this.service.findById(id);
  }

  @Patch(':id')
  @RequirePermission(ORG_SALES_CHANNELS.edit)
  update(@Param('id') id: string, @Body() dto: UpdateSalesChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/sales-channels/${id}`);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(ORG_SALES_CHANNELS.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/sales-channels/${id}`);
    return this.service.delete(id);
  }
}
