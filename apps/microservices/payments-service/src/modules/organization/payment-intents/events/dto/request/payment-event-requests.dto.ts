import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

// The events core has not acknowledged yet
export class PendingPaymentEventsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

// The events core has dispatched and need not be sent again
export class AckPaymentEventsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  ids: string[];
}
