// Enum value objects mirrored from commerce-service for gateway DTO validation

export const OrderSourceValues = {
  ONLINE: 'ONLINE' as const,
  WALK_IN: 'WALK_IN' as const,
};

export const OrderStatusValues = {
  PENDING: 'PENDING' as const,
  ACCEPTED: 'ACCEPTED' as const,
  PREPARING: 'PREPARING' as const,
  READY: 'READY' as const,
  COMPLETED: 'COMPLETED' as const,
  CANCELLED: 'CANCELLED' as const,
};

export const OrderItemStatusValues = {
  PENDING: 'PENDING' as const,
  PREPARING: 'PREPARING' as const,
  READY: 'READY' as const,
  SERVED: 'SERVED' as const,
  CANCELLED: 'CANCELLED' as const,
};

export const PaymentMethodValues = {
  CASH: 'CASH' as const,
  UPI: 'UPI' as const,
  CARD: 'CARD' as const,
  WALLET: 'WALLET' as const,
  UNPAID: 'UNPAID' as const,
};

export const InvoiceStatusValues = {
  DRAFT: 'DRAFT' as const,
  ISSUED: 'ISSUED' as const,
  PAID: 'PAID' as const,
  CANCELLED: 'CANCELLED' as const,
};
