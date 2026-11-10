export const INBOUND_DELIVERIES_KEY = ['commerce', 'inbound-deliveries'] as const;
export const INBOUND_DELIVERIES_TABLE_KEY = [...INBOUND_DELIVERIES_KEY, 'table'] as const;
export const INBOUND_DELIVERY_KEY = (id: string) => [...INBOUND_DELIVERIES_KEY, id] as const;
export const INBOUND_DELIVERY_LINES_TABLE_KEY = (id: string) =>
  [...INBOUND_DELIVERY_KEY(id), 'lines', 'table'] as const;
export const INBOUND_DELIVERY_ID_INDEX = INBOUND_DELIVERIES_KEY.length;
