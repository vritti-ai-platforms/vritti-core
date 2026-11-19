import type { InboundDeliveryLineDto } from '@domain/inbound-deliveries/dto/entity/inbound-delivery-line.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type InboundDeliveryLineDisplayDto = Record<
  'primaryUomQty' | 'receivedOnDeliveryPrimaryQty',
  DisplayUomQuantityDto | null
>;

export type InboundDeliveryLineWithDisplayDto = InboundDeliveryLineDto & { display: InboundDeliveryLineDisplayDto };
