import type {
  GoodsReceiptPermissions,
  UseAddGoodsReceiptLine,
  UseAddGoodsReceiptLineItem,
  UseAddGoodsReceiptLot,
  UseCreateGoodsReceiptFromDelivery,
  UseDeleteGoodsReceipt,
  UseGoodsReceipt,
  UseGoodsReceiptCounts,
  UseGoodsReceiptItem,
  UseGoodsReceiptItemQuants,
  UseGoodsReceiptItemsCost,
  UseGoodsReceiptLine,
  UseGoodsReceiptLineItemsTable,
  UseGoodsReceiptLinesByLotTable,
  UseGoodsReceiptLinesTable,
  UseGoodsReceiptLots,
  UseGoodsReceiptsTable,
  UseGoodsReceiptTree,
  UsePostGoodsReceipt,
  UseRemoveGoodsReceiptItem,
  UseRemoveGoodsReceiptLine,
  UseRemoveGoodsReceiptLineItem,
  UseRemoveGoodsReceiptLot,
  UseUpdateGoodsReceipt,
  UseUpdateGoodsReceiptItem,
  UseUpdateGoodsReceiptLine,
  UseUpdateGoodsReceiptLot,
} from './types';

export interface GoodsReceiptsBinding {
  permissions: GoodsReceiptPermissions;
  mrpEditPermission: string;
  spansSites: boolean;

  tableKey: readonly unknown[];
  tableSlug: string;
  linesTableKey: (id: string, itemId: string) => readonly unknown[];
  linesTableSlug: (id: string, itemId: string) => string;
  lotLinesTableKey: (id: string, itemId: string, lotId: string) => readonly unknown[];
  lotLinesTableSlug: (id: string, itemId: string, lotId: string) => string;
  lineItemsTableKey: (id: string, itemId: string, lineId: string) => readonly unknown[];
  lineItemsTableSlug: (id: string, lineId: string) => string;

  useTable: UseGoodsReceiptsTable;
  useGoodsReceipt: UseGoodsReceipt;
  useGoodsReceiptCounts: UseGoodsReceiptCounts;
  useTree: UseGoodsReceiptTree;
  useCreateFromDelivery: UseCreateGoodsReceiptFromDelivery;
  useUpdate: UseUpdateGoodsReceipt;
  usePost: UsePostGoodsReceipt;
  useDelete: UseDeleteGoodsReceipt;

  useItemsCost: UseGoodsReceiptItemsCost;
  useItemQuants: UseGoodsReceiptItemQuants;
  useItem: UseGoodsReceiptItem;
  useUpdateItem: UseUpdateGoodsReceiptItem;
  useRemoveItem: UseRemoveGoodsReceiptItem;

  useLots: UseGoodsReceiptLots;
  useAddLot: UseAddGoodsReceiptLot;
  useUpdateLot: UseUpdateGoodsReceiptLot;
  useRemoveLot: UseRemoveGoodsReceiptLot;

  useLinesTable: UseGoodsReceiptLinesTable;
  useLotLinesTable: UseGoodsReceiptLinesByLotTable;
  useLine: UseGoodsReceiptLine;
  useAddLine: UseAddGoodsReceiptLine;
  useUpdateLine: UseUpdateGoodsReceiptLine;
  useRemoveLine: UseRemoveGoodsReceiptLine;

  useLineItemsTable: UseGoodsReceiptLineItemsTable;
  useAddLineItem: UseAddGoodsReceiptLineItem;
  useRemoveLineItem: UseRemoveGoodsReceiptLineItem;
}
