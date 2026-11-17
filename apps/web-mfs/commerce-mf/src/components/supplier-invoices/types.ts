import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { SelectProps } from '@vritti/quantum-ui/Select';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import type { AxiosError } from 'axios';
import type { ComponentType } from 'react';
import type {
  AddSupplierInvoiceLineVars,
  CreateSupplierInvoicePayload,
  InvoiceableGoodsReceipt,
  InvoiceableGoodsReceiptsParams,
  ReleaseSupplierInvoiceHoldVars,
  RemoveSupplierInvoiceLineVars,
  SupplierInvoice,
  SupplierInvoiceRef,
  SupplierInvoicesTableResponse,
  UpdateSupplierInvoiceLineVars,
  UpdateSupplierInvoiceVars,
} from '@/schemas/supplier-invoices';

export interface SupplierInvoicePermissions {
  view: string;
  add: string;
  edit: string;
}

export interface SupplierInvoiceRemovalPermissions {
  cancel: string;
  delete: string;
}

export type SupplierInvoiceLink = Pick<SupplierInvoice, 'id' | 'invoiceNumber' | 'supplierId' | 'supplierName'>;

export type SupplierInvoicePath = (invoice: SupplierInvoiceLink) => string;

export type SupplierSelectorComponent = ComponentType<DistributiveOmit<SelectProps, 'optionsEndpoint'>>;

export type UsePurchaseOrderInvoicesTable = (purchaseOrderId: string) => {
  data: SupplierInvoicesTableResponse | undefined;
  isLoading: boolean;
};

export type UseInvoiceableGoodsReceipts = (
  invoice: SupplierInvoiceRef,
  params: InvoiceableGoodsReceiptsParams,
) => { data: InvoiceableGoodsReceipt[] | undefined; isLoading: boolean };

export type SupplierInvoiceMutationOptions<TData, TVars> = Omit<
  UseMutationOptions<TData, AxiosError, TVars>,
  'mutationFn'
>;
type Mutation<TData, TVars> = (
  options?: SupplierInvoiceMutationOptions<TData, TVars>,
) => UseMutationResult<TData, AxiosError, TVars>;

export type UseCreateInvoice = Mutation<SupplierInvoice, CreateSupplierInvoicePayload>;
export type UseUpdateInvoice = Mutation<SuccessResponse, UpdateSupplierInvoiceVars>;
export type UseInvoiceAction = Mutation<SuccessResponse, SupplierInvoiceRef>;
export type UseAddInvoiceLine = Mutation<SuccessResponse, AddSupplierInvoiceLineVars>;
export type UseUpdateInvoiceLine = Mutation<SuccessResponse, UpdateSupplierInvoiceLineVars>;
export type UseRemoveInvoiceLine = Mutation<SuccessResponse, RemoveSupplierInvoiceLineVars>;
export type UseReleaseInvoiceHold = Mutation<SuccessResponse, ReleaseSupplierInvoiceHoldVars>;
