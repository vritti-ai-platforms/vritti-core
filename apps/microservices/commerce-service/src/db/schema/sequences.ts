import { commerceSchema } from './commerce-schema';

export const purchaseOrderNumberSeq = commerceSchema.sequence('purchase_order_number_seq');
export const goodsReceiptNumberSeq = commerceSchema.sequence('goods_receipt_number_seq');
export const stockAdjustmentCodeSeq = commerceSchema.sequence('stock_adjustment_code_seq');
export const orderNumberSeq = commerceSchema.sequence('order_number_seq');
