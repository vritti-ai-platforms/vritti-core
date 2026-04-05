import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useRef } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useTaxGroups } from '@/hooks/useTaxGroups';
import { useUpdateItem } from '@/hooks/useUpdateItem';
import { type ItemDetail, type UpdateItemFormData, updateItemSchema } from '@/schemas/items';

interface BasicInfoTabProps {
  item: ItemDetail;
  onNext?: () => void;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ item, onNext }) => {
  const shouldAdvance = useRef(false);

  const form = useForm<UpdateItemFormData>({
    resolver: zodResolver(updateItemSchema),
    defaultValues: {
      name: item.name,
      description: item.description ?? '',
      basePrice: item.basePrice,
      costPrice: item.costPrice ?? '',
      taxGroupId: item.taxGroupId ?? undefined,
      hsnSacCode: item.hsnSacCode ?? '',
      isVisible: item.isVisible,
      trackInventory: item.trackInventory,
      categoryId: item.categoryId ?? undefined,
    },
  });

  const updateMutation = useUpdateItem({
    onSuccess: () => {
      if (shouldAdvance.current) {
        onNext?.();
      }
      shouldAdvance.current = false;
    },
  });
  const { data: categories = [] } = useCategories(item.businessUnitId);
  const { data: taxGroups = [] } = useTaxGroups(item.businessUnitId);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const taxGroupOptions = taxGroups.map((tg) => ({
    value: tg.id,
    label: tg.name,
    description: `${tg.rate}% GST`,
  }));

  const watchedTaxGroupId = form.watch('taxGroupId');
  const selectedTaxGroup = taxGroups.find((tg) => tg.id === watchedTaxGroupId);

  return (
    <Form
      form={form}
      mutation={updateMutation}
      showRootError
      resetOnSuccess={false}
      transformSubmit={(data) => ({
        id: item.id,
        data: {
          ...data,
          basePrice: data.basePrice ? Number(data.basePrice) : undefined,
          costPrice: data.costPrice ? Number(data.costPrice) : undefined,
          taxGroupId: data.taxGroupId || null,
        },
      })}
    >
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField name="name" label="Name" placeholder="Item name" />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-muted-foreground">Code / SKU</span>
                <span className="font-mono text-sm">{item.code}</span>
              </div>
            </div>
            <TextArea name="description" label="Description" placeholder="Optional description" rows={3} />
            <Select
              name="categoryId"
              label="Category"
              placeholder="Select a category"
              options={categoryOptions}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <TextField name="basePrice" label="Base Price" type="number" placeholder="0.00" />
              <TextField name="costPrice" label="Cost Price" type="number" placeholder="0.00" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Select
              name="taxGroupId"
              label="Tax Group"
              placeholder="Select tax group"
              options={taxGroupOptions}
            />
            {selectedTaxGroup && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
                {selectedTaxGroup.hsnSacCode && <span>HSN/SAC: {selectedTaxGroup.hsnSacCode}</span>}
                <span>CGST: {selectedTaxGroup.cgstRate}%</span>
                <span>SGST: {selectedTaxGroup.sgstRate}%</span>
                {selectedTaxGroup.igstRate > 0 && <span>IGST: {selectedTaxGroup.igstRate}%</span>}
                {selectedTaxGroup.cessRate > 0 && <span>Cess: {selectedTaxGroup.cessRate}%</span>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Switch name="isVisible" label="Visible on menu" />
            <Switch name="trackInventory" label="Track inventory" />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" variant="outline" loadingText="Saving..." onClick={() => { shouldAdvance.current = false; }}>
            Save
          </Button>
          <Button type="submit" loadingText="Saving..." onClick={() => { shouldAdvance.current = true; }}>
            Save & Continue
          </Button>
        </div>
      </div>
    </Form>
  );
};
