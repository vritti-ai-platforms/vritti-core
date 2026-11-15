export const RECEIVE_DELIVERY_PARAM = 'receiveDelivery';

// The query string that opens a goods receipts list's New Goods Receipt dialog with an inbound delivery preselected
export function receiveDeliverySearch(inboundDeliveryId: string): string {
  return `?${new URLSearchParams({ [RECEIVE_DELIVERY_PARAM]: inboundDeliveryId }).toString()}`;
}
