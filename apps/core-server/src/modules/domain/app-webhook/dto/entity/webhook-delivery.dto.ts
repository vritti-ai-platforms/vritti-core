import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type WebhookDelivery, type WebhookDeliveryStatus, WebhookDeliveryStatusValues } from '@/db/schema';

export class WebhookDeliveryDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ description: 'The payment event id, or test_<uuid> for a test send', example: 'uuid-here' })
  eventId: string;

  @ApiProperty({ example: 'payment_intent.succeeded' })
  eventType: string;

  @ApiProperty({ enum: Object.values(WebhookDeliveryStatusValues), example: 'PENDING' })
  status: WebhookDeliveryStatus;

  @ApiProperty({ example: 1 })
  attempts: number;

  @ApiPropertyOptional({ example: 500, nullable: true })
  lastStatusCode: number | null;

  @ApiPropertyOptional({ example: 'HTTP 500', nullable: true })
  lastError: string | null;

  @ApiProperty({ example: '2026-01-15T10:31:00Z' })
  nextAttemptAt: string;

  @ApiPropertyOptional({ example: '2026-01-15T10:30:01Z', nullable: true })
  deliveredAt: string | null;

  @ApiProperty({ example: '2026-01-15T10:30:00Z' })
  createdAt: string;

  // Creates a DTO from a delivery row, leaving the payload behind
  static from(row: WebhookDelivery): WebhookDeliveryDto {
    const dto = new WebhookDeliveryDto();
    dto.id = row.id;
    dto.eventId = row.eventId;
    dto.eventType = row.eventType;
    dto.status = row.status;
    dto.attempts = row.attempts;
    dto.lastStatusCode = row.lastStatusCode ?? null;
    dto.lastError = row.lastError ?? null;
    dto.nextAttemptAt = row.nextAttemptAt.toISOString();
    dto.deliveredAt = row.deliveredAt?.toISOString() ?? null;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
