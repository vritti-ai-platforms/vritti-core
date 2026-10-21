import type { PayoutChannelDto } from '@domain/payout-channel/dto/entity/payout-channel.dto';
import { CreatePayoutChannelDto } from '@domain/payout-channel/dto/request/create-payout-channel.dto';
import { UpdatePayoutChannelDto } from '@domain/payout-channel/dto/request/update-payout-channel.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OrgId } from '@/security/decorators';
import {
  ApiCreatePayoutChannelInternal,
  ApiDeletePayoutChannelInternal,
  ApiListPayoutChannelsInternal,
  ApiUpdatePayoutChannelInternal,
} from './docs/payout-channel-internal.docs';
import { ListPayoutChannelsInternalQueryDto } from './dto/request/list-payout-channels-internal-query.dto';
import { PayoutChannelService } from './services/payout-channel-api.service';

// The cloud-facing surface for payout channels
@ApiTags('Structure - Payout Channels (internal)')
@Require(AuthType.Cloud)
@Controller('payout-channels/internal')
export class PayoutChannelInternalController {
  private readonly logger = new Logger(PayoutChannelInternalController.name);

  constructor(private readonly payoutChannelService: PayoutChannelService) {}

  @Get()
  @ApiListPayoutChannelsInternal()
  list(@OrgId() orgId: string, @Query() query: ListPayoutChannelsInternalQueryDto): Promise<PayoutChannelDto[]> {
    this.logger.log(`GET /payout-channels/internal — legal entity ${query.legalEntityId}`);
    return this.payoutChannelService.list(orgId, query.legalEntityId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePayoutChannelInternal()
  create(@OrgId() orgId: string, @Body() dto: CreatePayoutChannelDto): Promise<CreateResponseDto<PayoutChannelDto>> {
    this.logger.log(`POST /payout-channels/internal — payout account ${dto.payoutAccountId}`);
    return this.payoutChannelService.create(orgId, dto);
  }

  @Patch(':id')
  @ApiUpdatePayoutChannelInternal()
  update(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayoutChannelDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /payout-channels/internal/${id}`);
    return this.payoutChannelService.update(orgId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePayoutChannelInternal()
  delete(@OrgId() orgId: string, @Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /payout-channels/internal/${id}`);
    return this.payoutChannelService.delete(orgId, id);
  }
}
