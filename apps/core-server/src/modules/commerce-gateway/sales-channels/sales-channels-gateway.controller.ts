import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import { CreateSalesChannelDto } from './dto/request/create-sales-channel.dto';
import { UpdateSalesChannelDto } from './dto/request/update-sales-channel.dto';
import type { SalesChannelResponseDto } from './dto/response/sales-channel-response.dto';
import type { SalesChannelTableResponseDto } from './dto/response/sales-channel-table-response.dto';
import { SalesChannelsGatewayService } from './services/sales-channels-gateway.service';

@ApiTags('Commerce - Sales Channels')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('sales-channels')
export class SalesChannelsGatewayController {
  private readonly logger = new Logger(SalesChannelsGatewayController.name);

  constructor(private readonly service: SalesChannelsGatewayService) {}

  @Get('table')
  getTable(@UserId() userId: string): Promise<SalesChannelTableResponseDto> {
    this.logger.log('GET /commerce-api/sales-channels/table');
    return this.service.findForTable(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSalesChannelDto): Promise<CreateResponseDto<SalesChannelResponseDto>> {
    this.logger.log('POST /commerce-api/sales-channels');
    return this.service.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<SalesChannelResponseDto> {
    this.logger.log(`GET /commerce-api/sales-channels/${id}`);
    return this.service.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSalesChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/sales-channels/${id}`);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/sales-channels/${id}`);
    return this.service.delete(id);
  }
}
