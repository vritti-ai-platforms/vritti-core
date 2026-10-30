import type { PayoutChannelDto } from '@domain/payout-channel/dto/entity/payout-channel.dto';
import { CreatePayoutChannelDto } from '@domain/payout-channel/dto/request/create-payout-channel.dto';
import { SwitchPayoutChannelAccountDto } from '@domain/payout-channel/dto/request/switch-payout-channel-account.dto';
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
  Put,
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
  ApiSwitchPayoutChannelAccountInternal,
  ApiUpdatePayoutChannelInternal,
} from './docs/payout-channel-internal.docs';
import { ListPayoutChannelsInternalQueryDto } from './dto/request/list-payout-channels-internal-query.dto';
import { PayoutChannelService } from './services/payout-channel-api.service';

@ApiTags('Structure - Payout Channels (internal)')
@Require(AuthType.Cloud)
@Controller('payout-channels/internal')
export class PayoutChannelInternalController {
  private readonly logger = new Logger(PayoutChannelInternalController.name);

  constructor(private readonly payoutChannelService: PayoutChannelService) {}

  // Lists a legal entity's payout channels
  @Get()
  @ApiListPayoutChannelsInternal()
  list(@Query() query: ListPayoutChannelsInternalQueryDto): Promise<PayoutChannelDto[]> {
    this.logger.log(`GET /payout-channels/internal — legal entity ${query.legalEntityId}`);
    return this.payoutChannelService.list(query.legalEntityId);
  }

  // Gives a scope a bank account, its payout accounts switched off
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePayoutChannelInternal()
  create(@OrgId() orgId: string, @Body() dto: CreatePayoutChannelDto): Promise<CreateResponseDto<PayoutChannelDto>> {
    this.logger.log(`POST /payout-channels/internal — bank account ${dto.bankAccountId}`);
    return this.payoutChannelService.create(orgId, dto);
  }

  // Moves a payout channel to another bank account
  @Patch(':id')
  @ApiUpdatePayoutChannelInternal()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePayoutChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /payout-channels/internal/${id}`);
    return this.payoutChannelService.update(id, dto);
  }

  // Switches one payout account of the channel's bank account on or off
  @Put(':id/payout-accounts/:payoutAccountId')
  @ApiSwitchPayoutChannelAccountInternal()
  switchAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('payoutAccountId', ParseUUIDPipe) payoutAccountId: string,
    @Body() dto: SwitchPayoutChannelAccountDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /payout-channels/internal/${id}/payout-accounts/${payoutAccountId}`);
    return this.payoutChannelService.switchAccount(id, payoutAccountId, dto);
  }

  // Removes a payout channel
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeletePayoutChannelInternal()
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /payout-channels/internal/${id}`);
    return this.payoutChannelService.delete(id);
  }
}
