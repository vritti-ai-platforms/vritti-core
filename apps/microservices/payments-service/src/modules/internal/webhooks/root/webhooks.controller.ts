import type { WebhookIngestResultDto } from '@domain/webhook-events/dto/entity/webhook-ingest-result.dto';
import { IngestWebhookDto } from '@domain/webhook-events/dto/request/ingest-webhook.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WebhooksService } from './services/webhooks.service';

// Reached only through core's public webhook edge, which resolves the config and decrypts the
// secret before forwarding; the org context arrives both in the payload (what is written) and as
// NATS headers (what RLS checks it against)
@Controller()
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly service: WebhooksService) {}

  @MessagePattern({ cmd: 'payments.webhooks.ingest' })
  async ingest(@Payload() dto: IngestWebhookDto): Promise<WebhookIngestResultDto> {
    this.logger.log(`webhooks.ingest — gateway: ${dto.gatewayCode}, config: ${dto.configId}`);
    return this.service.ingest(dto);
  }
}
