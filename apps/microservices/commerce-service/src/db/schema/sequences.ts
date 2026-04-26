import { coreSchema } from './core-schema';

export const purchaseOrderNumberSeq = coreSchema.sequence('purchase_order_number_seq');
export const goodsReceiptNumberSeq = coreSchema.sequence('goods_receipt_number_seq');
export const stockAdjustmentCodeSeq = coreSchema.sequence('stock_adjustment_code_seq');
export const orderNumberSeq = coreSchema.sequence('order_number_seq');
export const itemCodeSeq = coreSchema.sequence('item_code_seq');
