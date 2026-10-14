import { ApiProperty } from '@nestjs/swagger';
import { type AppWebhookEndpoint, PAYMENT_WEBHOOK_EVENT_TYPES } from '@/db/schema';

export class AppWebhookEndpointDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  appId: string;

  @ApiProperty({ example: 'https://shop.example.com/webhooks/vritti' })
  url: string;

  @ApiProperty({ enum: PAYMENT_WEBHOOK_EVENT_TYPES, isArray: true, example: [...PAYMENT_WEBHOOK_EVENT_TYPES] })
  events: string[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from an endpoint row
  static from(row: AppWebhookEndpoint): AppWebhookEndpointDto {
    const dto = new AppWebhookEndpointDto();
    dto.id = row.id;
    dto.appId = row.appId;
    dto.url = row.url;
    dto.events = row.events;
    dto.isActive = row.isActive;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
