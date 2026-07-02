import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf, SuccessResponseDto } from '@vritti/api-sdk';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { WebhookSessionInterceptor } from '@/common/interceptors/webhook-session.interceptor';
import {
  ApiCreateBusinessUnitWebhook,
  ApiDeleteBusinessUnitWebhook,
  ApiGetBusinessUnitWebhook,
  ApiListBusinessUnitsWebhook,
  ApiSetBuUnlocksWebhook,
  ApiUpdateBusinessUnitWebhook,
} from '../docs/business-unit.docs';
import { BusinessUnitDto } from '../dto/entity/business-unit.dto';
import { CreateBusinessUnitWebhookDto } from '../dto/request/create-business-unit-webhook.dto';
import { SetBuUnlocksWebhookDto } from '../dto/request/set-bu-unlocks-webhook.dto';
import { UpdateBusinessUnitWebhookDto } from '../dto/request/update-business-unit-webhook.dto';
import { BusinessUnitApiService } from '../services/business-unit-api.service';

@ApiTags('Business Units')
@Controller('business-units/webhook')
@Public()
@SkipCsrf()
@UseGuards(WebhookSecretGuard)
@UseInterceptors(WebhookSessionInterceptor)
export class BusinessUnitController {
  private readonly logger = new Logger(BusinessUnitController.name);

  constructor(private readonly businessUnitApiService: BusinessUnitApiService) {}

  // Creates a new business unit for an organization
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateBusinessUnitWebhook()
  async create(@Body() dto: CreateBusinessUnitWebhookDto): Promise<BusinessUnitDto> {
    this.logger.log(`POST /api/business-units/webhook — "${dto.name}" for org ${dto.orgId}`);
    return this.businessUnitApiService.create(dto.orgId, dto);
  }

  // Lists all business units for an organization
  @Get()
  @ApiListBusinessUnitsWebhook()
  async list(@Query('orgId') orgId: string): Promise<BusinessUnitDto[]> {
    this.logger.log(`GET /api/business-units/webhook?orgId=${orgId}`);
    return this.businessUnitApiService.findByOrg(orgId);
  }

  // Returns a business unit and its subtree
  @Get(':id')
  @ApiGetBusinessUnitWebhook()
  async getById(@Param('id') id: string): Promise<BusinessUnitDto[]> {
    this.logger.log(`GET /api/business-units/webhook/${id}`);
    return this.businessUnitApiService.findSubtree(id);
  }

  // Lists role assignments for a business unit
  @Get(':id/role-assignments')
  async listRoleAssignments(@Param('id') id: string) {
    this.logger.log(`GET /api/business-units/webhook/${id}/role-assignments`);
    return this.businessUnitApiService.findRoleAssignments(id);
  }

  // Replaces the business unit's feature unlock overlay (null = inherit the full plan)
  @Put(':id/unlocks')
  @ApiSetBuUnlocksWebhook()
  async setUnlocks(@Param('id') id: string, @Body() dto: SetBuUnlocksWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /api/business-units/webhook/${id}/unlocks`);
    return this.businessUnitApiService.setFeatureUnlocks(id, dto);
  }

  // Updates a business unit
  @Patch(':id')
  @ApiUpdateBusinessUnitWebhook()
  async update(@Param('id') id: string, @Body() dto: UpdateBusinessUnitWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /api/business-units/webhook/${id}`);
    return this.businessUnitApiService.update(id, dto);
  }

  // Deletes a business unit
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteBusinessUnitWebhook()
  async remove(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /api/business-units/webhook/${id}`);
    return this.businessUnitApiService.remove(id);
  }
}
