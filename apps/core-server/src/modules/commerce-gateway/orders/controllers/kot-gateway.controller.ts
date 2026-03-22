import { Body, Controller, Get, Logger, Param, Patch, Query } from '@nestjs/common';
import { UserId } from '@vritti/api-sdk';
import { UserService } from '../../../user/services/user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type Observable, firstValueFrom } from 'rxjs';
import { UpdateItemStatusDto } from '../dto/request/update-item-status.dto';
import { KotGatewayService } from '../services/kot-gateway.service';

@ApiTags('Commerce — KOT')
@ApiBearerAuth()
@Controller('kot')
export class KotGatewayController {
  private readonly logger = new Logger(KotGatewayController.name);

  constructor(private readonly kotGatewayService: KotGatewayService,
    private readonly userService: UserService,
  ) {}

  // Finds active KOT items for an org+bu
  @Get()
  async findActive(
    @UserId() userId: string,
    @Query('businessUnitId') businessUnitId: string,
  ): Promise<unknown> {
    this.logger.log('GET /commerce-api/kot');
    const user = await this.userService.findByIdOrThrow(userId);
    return firstValueFrom(this.kotGatewayService.findActive(user.organizationId, businessUnitId));
  }

  // Updates a KOT item's status
  @Patch('items/:itemId/status')
  updateItemStatus(@Param('itemId') itemId: string, @Body() dto: UpdateItemStatusDto): Observable<unknown> {
    this.logger.log(`PATCH /commerce-api/kot/items/${itemId}/status`);
    return this.kotGatewayService.updateItemStatus(itemId, dto.status);
  }
}
