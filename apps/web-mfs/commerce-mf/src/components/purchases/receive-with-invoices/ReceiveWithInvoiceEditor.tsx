import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DateTimePicker } from '@vritti/quantum-ui/DateTimePicker';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import Decimal from '@vritti/quantum-ui/decimal';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useConfirm, useDialog, useWorkspaceCurrency, useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { Plus, ReceiptText, Save, Send, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  buildReceiveWithInvoiceSchema,
  type ReceiveWithInvoiceDetail,
  type ReceiveWithInvoiceFormData,
  type ReceiveWithInvoiceFormValues,
  type ReceiveWithInvoicePayload,
} from '@/schemas/receive-with-invoices';
import { CurrencySelector } from '@/selectors/currency';
import { LocationSelector } from '@/selectors/location';
import type { PurchasesBinding } from '../bindings';
import { PartOfPurchaseChips } from '../PartOfPurchaseChips';
import { ReceiveWithInvoiceLineDialog } from './ReceiveWithInvoiceLineDialog';
import { ReceiveWithInvoiceLinesTable } from './ReceiveWithInvoiceLinesTable';
import { ReceiveWithInvoiceTotalsCard } from './ReceiveWithInvoiceTotalsCard';
import { invoiceAmount, receiveWithInvoiceTotals } from './receiveWithInvoiceLines';

const FORM_ID = 'receive-with-invoice-form';

// An amount the API sends as zero for one that is not set, left empty in the form
function enteredAmount(amount: CurrencyValue): CurrencyValue | undefined {
  return new Decimal(amount.value).isZero() ? undefined : amount;
}

// A saved draft as the form edits it; amounts the API sends as zero are left empty
function draftFormValues(invoice: ReceiveWithInvoiceDetail): ReceiveWithInvoiceFormValues {
  return {
    supplierId: invoice.supplierId,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    taxDate: invoice.taxDate ?? invoice.invoiceDate,
    currencyCode: invoice.currencyCode,
    exchangeRate: invoice.exchangeRate ?? undefined,
    receivedDate: invoice.receivedDate,
    defaultLocationId: invoice.defaultLocationId,
    supplierDeliveryNoteNumber: invoice.supplierDeliveryNoteNumber ?? '',
    notes: invoice.notes ?? '',
    lines: invoice.lines.map((line) => ({
      allocationId: line.allocationId,
      quantity: line.quantity,
      freeQty: line.freeQty,
      unitPrice: line.unitPrice,
      discountAmount: enteredAmount(line.discountAmount),
      taxAmount: enteredAmount(line.taxAmount),
      lotNumber: line.lotNumber ?? '',
      expiryDate: line.expiryDate,
      manufacturingDate: line.manufacturingDate,
      mrp: enteredAmount(line.mrp),
      locationId: line.locationId ?? undefined,
    })),
  };
}

interface ReceiveWithInvoiceEditorProps {
  binding: PurchasesBinding;
  // The draft being edited; a new invoice is entered without it
  invoice?: ReceiveWithInvoiceDetail;
  // A new invoice's supplier, when it comes from a leg
  supplierId?: string;
  // The invoice's site, where the session has none
  siteId?: string;
}

// `…/purchases/receive-with-invoices/new` and a draft's `…/receive-with-invoices/<number~id>` — the supplier's
// invoice entered once with the goods it brings: its header, where the goods are put, and a line per item and batch
// picked from the supplier's open allocations. Saving keeps it as a draft; posting receives the goods and posts the
// invoice together
export const ReceiveWithInvoiceEditor: React.FC<ReceiveWithInvoiceEditorProps> = ({
  binding,
  invoice,
  supplierId,
  siteId,
}) => {
  const { permissions, SupplierSelector, receiveWithInvoices } = binding;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const lineDialog = useDialog();
  const leCurrencyCode = useWorkspaceCurrency();
  const invoiceSiteId = invoice?.siteId ?? siteId;
  const canSetMrp = usePermission(binding.mrpEditPermission).available;
  const schema = useMemo(() => buildReceiveWithInvoiceSchema({ leCurrencyCode }), [leCurrencyCode]);
  const today = isoTodayDate(useWorkspaceTimeZone(invoiceSiteId));
  const form = useForm<ReceiveWithInvoiceFormValues, unknown, ReceiveWithInvoiceFormData>({
    resolver: zodResolver(schema),
    defaultValues: invoice
      ? draftFormValues(invoice)
      : {
          supplierId,
          invoiceNumber: '',
          invoiceDate: today,
          taxDate: today,
          receivedDate: new Date().toISOString(),
          supplierDeliveryNoteNumber: '',
          notes: '',
          lines: [],
        },
  });
  const {
    append: appendLine,
    update: updateLine,
    remove: removeLine,
    replace: replaceLines,
  } = useFieldArray({
    control: form.control,
    name: 'lines',
  });
  const [pickedSupplierId, currencyCode, exchangeRate, invoiceDate, lines] = useWatch({
    control: form.control,
    name: ['supplierId', 'currencyCode', 'exchangeRate', 'invoiceDate', 'lines'],
  });
  const [supplierCurrencies, setSupplierCurrencies] = useState<string[]>([]);
  const lastSupplierIdRef = useRef<string | undefined>(pickedSupplierId);
  const needsExchangeRate = !!currencyCode && currencyCode !== leCurrencyCode;
  const locationParams = invoiceSiteId ? binding.locationParams?.(invoiceSiteId) : undefined;

  const openLinesQuery = receiveWithInvoices.useOpenLines({
    supplierId: pickedSupplierId,
    siteId: invoiceSiteId,
    excludeInvoiceId: invoice?.supplierInvoiceId,
  });
  const openLines = openLinesQuery.data ?? [];
  // Each line shows the item and purchase of the allocation it receives
  const tableLines = useMemo(() => {
    const openLinesById = new Map(openLines.map((open) => [open.allocationId, open]));
    return lines.map((line) => {
      const open = openLinesById.get(line.allocationId);
      return {
        ...line,
        inventoryItemName: open?.inventoryItemName,
        uomSymbol: open?.uomSymbol,
        purchaseNumber: open?.purchaseNumber,
      };
    });
  }, [lines, openLines]);
  const totals = receiveWithInvoiceTotals(lines, currencyCode ?? leCurrencyCode);
  const isDirty = form.formState.isDirty;
  const linesError = form.formState.errors.lines?.message ?? form.formState.errors.lines?.root?.message;

  const createMutation = receiveWithInvoices.useCreate({
    onSuccess: (response, variables) =>
      navigate(`../${buildSlug(variables.invoiceNumber, response.data.supplierInvoiceId)}`, {
        relative: 'path',
        replace: true,
      }),
  });
  const updateMutation = receiveWithInvoices.useUpdate({ onSuccess: () => form.reset(form.getValues()) });
  const postMutation = receiveWithInvoices.usePost();
  const discardMutation = receiveWithInvoices.useDiscard({ onSuccess: () => navigate('../..', { relative: 'path' }) });

  // The tax date follows the invoice date until it is picked
  useEffect(() => {
    if (invoiceDate && !form.getFieldState('taxDate').isDirty) form.setValue('taxDate', invoiceDate);
  }, [invoiceDate, form]);

  // The supplier offers its own currencies, starting from its default; another supplier starts the lines over, since
  // they are picked from its allocations
  const handleSupplierSelect = (option: SelectOption | null) => {
    const codes = option?.additionals?.currencyCodes;
    const defaultCode = option?.additionals?.currencyCode;
    setSupplierCurrencies(Array.isArray(codes) ? codes.map(String) : []);
    const nextSupplierId = option ? String(option.value) : undefined;
    const changed = nextSupplierId !== lastSupplierIdRef.current;
    lastSupplierIdRef.current = nextSupplierId;
    if (changed) replaceLines([]);
    if (typeof defaultCode === 'string' && (changed || !form.getValues('currencyCode'))) {
      form.setValue('currencyCode', defaultCode, { shouldValidate: true });
    }
  };

  // The invoice as the API takes it: every amount in the invoice currency, the MRP only where the user may set it
  const toPayload = (data: ReceiveWithInvoiceFormData): ReceiveWithInvoicePayload => ({
    siteId: invoice ? undefined : siteId,
    supplierId: data.supplierId,
    invoiceNumber: data.invoiceNumber,
    invoiceDate: data.invoiceDate,
    taxDate: data.taxDate,
    currencyCode: data.currencyCode,
    exchangeRate: data.currencyCode === leCurrencyCode ? undefined : data.exchangeRate,
    receivedDate: data.receivedDate,
    defaultLocationId: data.defaultLocationId,
    supplierDeliveryNoteNumber: data.supplierDeliveryNoteNumber || undefined,
    notes: data.notes || undefined,
    lines: data.lines.map((line) => ({
      allocationId: line.allocationId,
      quantity: line.quantity,
      freeQty: line.freeQty,
      unitPrice: { currency: data.currencyCode, value: line.unitPrice.value },
      discountAmount: invoiceAmount(line.discountAmount, data.currencyCode),
      taxAmount: invoiceAmount(line.taxAmount, data.currencyCode),
      lotNumber: line.lotNumber || undefined,
      expiryDate: line.expiryDate || undefined,
      manufacturingDate: line.manufacturingDate || undefined,
      mrp: canSetMrp ? invoiceAmount(line.mrp, leCurrencyCode) : undefined,
      locationId: line.locationId,
    })),
  });

  // Confirms and posts the saved draft: its receipts land in stock and its invoice settles their cost
  const handlePost = async (draft: ReceiveWithInvoiceDetail) => {
    const confirmed = await confirm({
      title: `Post ${draft.invoiceNumber}?`,
      description:
        'The goods land in stock at their locations, the purchases move on, and the invoice is posted. Holds it ' +
        'raises do not stop posting but keep it from being paid until released. This cannot be undone.',
      confirmLabel: 'Post',
    });
    if (confirmed) postMutation.mutate(draft.supplierInvoiceId);
  };

  // Confirms and discards the draft with the receipts and deliveries it created
  const handleDiscard = async (draft: ReceiveWithInvoiceDetail) => {
    const confirmed = await confirm({
      title: `Discard ${draft.invoiceNumber}?`,
      description:
        'The draft invoice, its draft receipts and their deliveries are deleted, and an order it created is removed ' +
        'when nothing else uses it. The allocations stay open. This cannot be undone.',
      confirmLabel: 'Discard',
      variant: 'destructive',
    });
    if (confirmed) discardMutation.mutate(draft.supplierInvoiceId);
  };

  const saveMutation = invoice ? updateMutation : createMutation;
  const fields = (
    <>
      <FormSection title="Supplier & Site">
        <SupplierSelector
          name="supplierId"
          params={invoiceSiteId ? binding.supplierParams?.(invoiceSiteId) : undefined}
          onOptionSelect={handleSupplierSelect}
          disabled={!!invoice}
          disabledTip="A saved invoice keeps its supplier; discard it to invoice another"
        />
        <LocationSelector
          name="defaultLocationId"
          label="Default Location"
          params={locationParams}
          description="Where the goods are put unless a line names its own"
        />
      </FormSection>
      <FormSection title="Invoice">
        <TextField name="invoiceNumber" label="Invoice Number" placeholder="As printed by the supplier" />
        <DatePicker name="invoiceDate" label="Invoice Date" />
        <DatePicker name="taxDate" label="Tax Date" description="Follows the invoice date until changed" />
        <CurrencySelector
          name="currencyCode"
          includeCodes={supplierCurrencies}
          disabled={supplierCurrencies.length < 2}
          disabledTip={
            supplierCurrencies.length
              ? `This supplier trades only in ${supplierCurrencies[0]}`
              : 'Select a supplier to choose from its currencies'
          }
          placeholder={supplierCurrencies.length ? 'Select currency' : 'Select a supplier first'}
        />
        {needsExchangeRate && (
          <TextField
            name="exchangeRate"
            label={`1 ${currencyCode} in ${leCurrencyCode}`}
            type="number"
            placeholder="e.g. 83.25"
            positive
            nonZero
          />
        )}
      </FormSection>
      <FormSection title="Goods">
        <DateTimePicker name="receivedDate" label="Received" />
        <TextField name="supplierDeliveryNoteNumber" label="Delivery Note No. (optional)" />
        <TextArea name="notes" label="Notes (optional)" placeholder="e.g. Two cartons damaged in transit" />
      </FormSection>
    </>
  );

  const lineEditing = useMemo(
    () => ({
      permission: permissions.receive,
      renderEdit: (index: number, close: () => void) => (
        <ReceiveWithInvoiceLineDialog
          binding={binding}
          openLines={openLines}
          currencyCode={currencyCode ?? leCurrencyCode}
          siteId={invoiceSiteId}
          line={lines[index]}
          onSave={(line) => {
            updateLine(index, line);
            close();
          }}
          onCancel={close}
        />
      ),
      onRemove: removeLine,
    }),
    [
      permissions.receive,
      binding,
      openLines,
      currencyCode,
      leCurrencyCode,
      invoiceSiteId,
      lines,
      updateLine,
      removeLine,
    ],
  );

  const addLineAction = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      permission={permissions.receive}
      startAdornment={<Plus className="size-4" />}
      onClick={lineDialog.open}
      disabled={!pickedSupplierId || !currencyCode}
      disabledTip="Pick the supplier and the invoice currency first."
    >
      Add Line
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={invoice ? invoice.invoiceNumber : 'New Receive with Invoice'}
        titleSlot={
          invoice && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Draft</Badge>
              <PartOfPurchaseChips purchases={invoice.purchases} />
            </div>
          )
        }
        description={
          invoice
            ? `Receive with Invoice from ${invoice.supplierName}`
            : 'A supplier invoice that comes with the goods: receive them and enter the invoice in one go'
        }
        actions={
          <div className="flex items-center gap-2">
            {invoice && (
              <Button
                size="sm"
                variant="outline"
                permission={permissions.receive}
                startAdornment={<Trash2 className="size-4" />}
                onClick={() => handleDiscard(invoice)}
                isLoading={discardMutation.isPending}
              >
                Discard
              </Button>
            )}
            <Button
              type="submit"
              form={FORM_ID}
              size="sm"
              variant={invoice ? 'outline' : 'default'}
              permission={permissions.receive}
              startAdornment={<Save className="size-4" />}
              isLoading={saveMutation.isPending}
              disabled={!!invoice && !isDirty}
              disabledTip="No changes to save"
            >
              Save Draft
            </Button>
            {invoice && (
              <Button
                size="sm"
                permission={permissions.receive}
                startAdornment={<Send className="size-4" />}
                onClick={() => handlePost(invoice)}
                isLoading={postMutation.isPending}
                disabled={isDirty}
                disabledTip="Save your changes before posting"
              >
                Post
              </Button>
            )}
          </div>
        }
      />

      {invoice ? (
        <Form
          id={FORM_ID}
          form={form}
          mutation={updateMutation}
          transformSubmit={(data) => ({ invoiceId: invoice.supplierInvoiceId, data: toPayload(data) })}
          className="flex flex-col gap-6"
        >
          {fields}
        </Form>
      ) : (
        <Form
          id={FORM_ID}
          form={form}
          mutation={createMutation}
          transformSubmit={toPayload}
          className="flex flex-col gap-6"
        >
          {fields}
        </Form>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lines</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ReceiveWithInvoiceLinesTable
            lines={tableLines}
            currencyCode={currencyCode ?? leCurrencyCode}
            isLoading={openLinesQuery.isLoading}
            toolbarAction={addLineAction}
            editing={lineEditing}
          />
          {linesError && (
            <Typography variant="caption" intent="error">
              {linesError}
            </Typography>
          )}
        </CardContent>
      </Card>

      <ReceiveWithInvoiceTotalsCard totals={totals} exchangeRate={needsExchangeRate ? exchangeRate : undefined} />

      <Dialog
        handle={lineDialog}
        icon={ReceiptText}
        title="Add Line"
        description="An item and batch the invoice brings, from the supplier's open allocations at this site."
        className="max-w-2xl"
        content={(close) => (
          <ReceiveWithInvoiceLineDialog
            binding={binding}
            openLines={openLines}
            currencyCode={currencyCode ?? leCurrencyCode}
            siteId={invoiceSiteId}
            onSave={(line) => {
              appendLine(line);
              form.clearErrors('lines');
              close();
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
