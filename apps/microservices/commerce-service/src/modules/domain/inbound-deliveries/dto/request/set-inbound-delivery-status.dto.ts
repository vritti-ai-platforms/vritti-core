import { IsIn, IsUUID } from 'class-validator';
import { type InboundDeliveryStatus, InboundDeliveryStatusValues } from '@/db/schema';

export const MANUAL_INBOUND_DELIVERY_STATUSES: InboundDeliveryStatus[] = [
  InboundDeliveryStatusValues.IN_TRANSIT,
  InboundDeliveryStatusValues.ARRIVED,
  InboundDeliveryStatusValues.CANCELLED,
];

export class SetInboundDeliveryStatusDto {
  @IsUUID('7')
  id: string;

  @IsIn(MANUAL_INBOUND_DELIVERY_STATUSES)
  status: InboundDeliveryStatus;
}
