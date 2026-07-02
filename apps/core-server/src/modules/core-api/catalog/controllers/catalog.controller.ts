import { CatalogService } from '@domain/catalog/services/catalog.service';
import { Body, Controller, HttpCode, HttpStatus, Logger, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf, type SuccessResponseDto } from '@vritti/api-sdk';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { ApiReceiveCatalogWebhook } from '../docs/catalog.docs';
import { ReceiveCatalogWebhookDto } from '../dto/request/receive-catalog-webhook.dto';

@ApiTags('Catalog')
@Controller('catalog/webhook')
@Public()
@SkipCsrf()
@UseGuards(WebhookSecretGuard)
export class CatalogController {
  private readonly logger = new Logger(CatalogController.name);

  constructor(private readonly catalogService: CatalogService) {}

  // Receives the signed catalog license from cloud-server (one per deployment, idempotent by hash)
  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiReceiveCatalogWebhook()
  async receive(@Body() dto: ReceiveCatalogWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /catalog/webhook — version ${dto.payload?.version}`);
    return this.catalogService.receive(dto);
  }
}
