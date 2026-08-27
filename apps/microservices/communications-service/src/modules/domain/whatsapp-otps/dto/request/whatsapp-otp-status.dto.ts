import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const SENT = 'sent';
export const DELIVERED = 'delivered';
export const READ = 'read';
export const FAILED = 'failed';

export const DELIVERY_STATUSES = [SENT, DELIVERED, READ, FAILED] as const;

// Meta's lifecycle is sent -> delivered -> read, with failed off to the side. Retries, multi-app
// fan-out and unordered delivery all mean callbacks arrive out of sequence, so rank them and only
// ever move forward.
//
// `failed` sits BELOW `delivered` deliberately. Meta documents that one message can raise both — a
// recipient logged in on several devices may take delivery on one and fail on another — and that
// "any message that triggers a delivered status webhook has been delivered to at least one of the
// user's devices". Ranking failed highest would let that stray failure overwrite a real delivery.
const RANK: Record<string, number> = { [SENT]: 1, [FAILED]: 2, [DELIVERED]: 3, [READ]: 4 };

// Whether a callback advances the record. Unknown current status means nothing has landed yet.
export function isForwardTransition(current: string | null, next: string): boolean {
  if (!current) return true;
  return (RANK[next] ?? 0) > (RANK[current] ?? 0);
}

export class WhatsappOtpStatusDto {
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
