import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const SENT = 'sent';
export const DELIVERED = 'delivered';
export const FAILED = 'failed';

// No `read` — SMS has no read receipts. Dormant until a real provider ships delivery webhooks;
// the console transport delivers nothing asynchronously.
export const DELIVERY_STATUSES = [SENT, DELIVERED, FAILED] as const;

// Vendors retry callbacks and deliver them out of order, so rank the lifecycle and only move
// forward. `failed` sits below `delivered` for the same reason as WhatsApp: a stray per-device
// failure must not overwrite a real delivery.
const RANK: Record<string, number> = { [SENT]: 1, [FAILED]: 2, [DELIVERED]: 3 };

export function isForwardTransition(current: string | null, next: string): boolean {
  if (!current) return true;
  return (RANK[next] ?? 0) > (RANK[current] ?? 0);
}

export class SmsOtpStatusDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsIn(DELIVERY_STATUSES)
  status: string;

  @IsInt()
  timestamp: number;

  @IsOptional()
  @IsString()
  error?: string;
}
