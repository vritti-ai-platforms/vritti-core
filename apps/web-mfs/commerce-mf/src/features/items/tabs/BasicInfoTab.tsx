import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCategories } from '@/hooks/useCategories';
import { useTaxGroups } from '@/hooks/useTaxGroups';
import { useUpdateItem } from '@/hooks/useUpdateItem';
import { type ItemDetail, type UpdateItemFormData, updateItemSchema } from '@/schemas/items';

interface BasicInfoTabProps {
  item: ItemDetail;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ item }) => {
  const form = useForm<UpdateItemFormData>({
    resolver: zodResolver(updateItemSchema),
    defaultValues: {
      name: item.name,
      description: item.description ?? '',
      basePrice: item.basePrice,
      taxGroupId: item.taxGroupId ?? undefined,
      categoryId: item.categoryId ?? undefined,
    },
  });

  const updateMutation = useUpdateItem();
  const { data: categories = [] } = useCategories(item.businessUnitId);
  const { data: taxGroups = [] } = useTaxGroups(item.businessUnitId);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const taxGroupOptions = taxGroups.map((tg) => ({
    value: tg.id,
    label: tg.name,
    description: tg.taxRates.map((r) => `${r.name} ${r.rate}%`).join(', '),
  }));

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
            <TextField name="basePrice" label="Base Price" type="number" placeholder="0.00" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              name="taxGroupId"
              label="Tax Group"
              placeholder="Select tax group"
              options={taxGroupOptions}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loadingText="Saving...">
            Save
          </Button>
        </div>
      </div>
    </Form>
  );
};
