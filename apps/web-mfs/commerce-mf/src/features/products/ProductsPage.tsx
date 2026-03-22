import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DataTable, type ColumnDef, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { FieldGroup, Form } from '@vritti/quantum-ui/Form';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/utils/slug';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCommerceContext } from '../../context/CommerceContext';
import { useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from '../../hooks';
import { type CreateProductInput, type Product, type UpdateProductInput, createProductSchema, updateProductSchema } from '../../schemas';

export const ProductsPage = () => {
  const { businessUnitId } = useCommerceContext();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts(businessUnitId);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const addDialog = useDialog();
  const editDialog = useDialog();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const addForm = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: '', price: 0 },
  });

  const editForm = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
  });

  const columns: ColumnDef<Product, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }: { row: { original: Product } }) => (
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => navigate(buildSlug(row.original.name, row.original.id))}
          >
            {row.original.name}
          </Button>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }: { row: { original: Product } }) => `$${row.original.price}`,
      },
      { accessorKey: 'sku', header: 'SKU' },
      {
        accessorKey: 'isAvailable',
        header: 'Available',
        cell: ({ row }: { row: { original: Product } }) => (
          <Badge variant={row.original.isAvailable ? 'default' : 'secondary'}>
            {row.original.isAvailable ? 'Yes' : 'No'}
          </Badge>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }: { row: { original: Product } }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }: { row: { original: Product } }) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingProduct(row.original);
                editForm.reset({
                  name: row.original.name,
                  price: Number(row.original.price),
                  sku: row.original.sku ?? undefined,
                  description: row.original.description ?? undefined,
                  image: row.original.image ?? undefined,
                  unit: row.original.unit ?? undefined,
                });
                editDialog.open();
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(row.original.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate, editDialog, editForm, deleteMutation],
  );

  const { table } = useDataTable({
    columns,
    slug: 'products',
    label: 'product',
    serverState: { result: products, count: products.length },
    enableRowSelection: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        actions={
          <Button onClick={addDialog.open}>
            <Plus className="size-4 mr-2" />
            Add Product
          </Button>
        }
      />

      <DataTable table={table} isLoading={isLoading} />

      {/* Add Product Dialog */}
      <Dialog
        open={addDialog.isOpen}
        onOpenChange={(v) => { if (!v) addDialog.close(); }}
        title="Add Product"
        description="Create a new product"
        content={(close) => (
          <Form<CreateProductInput>
            form={addForm}
            onSubmit={(data) => {
              createMutation.mutate(
                { ...data, businessUnitId },
                { onSuccess: () => { addForm.reset(); close(); } },
              );
            }}
          >
            <FieldGroup>
              <TextField name="name" label="Name" placeholder="Product name" />
              <TextField name="price" label="Price" type="number" placeholder="0.00" />
              <TextField name="sku" label="SKU" placeholder="SKU-001" />
              <TextField name="description" label="Description" placeholder="Product description" />
              <TextField name="image" label="Image URL" placeholder="https://..." />
              <TextField name="unit" label="Unit" placeholder="e.g. kg, piece" />
            </FieldGroup>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={close}>Cancel</Button>
              <Button type="submit" isLoading={createMutation.isPending}>Create</Button>
            </div>
          </Form>
        )}
      />

      {/* Edit Product Dialog */}
      <Dialog
        open={editDialog.isOpen}
        onOpenChange={(v) => { if (!v) editDialog.close(); }}
        title="Edit Product"
        description="Update product details"
        content={(close) => (
          <Form<UpdateProductInput>
            form={editForm}
            onSubmit={(data) => {
              if (!editingProduct) return;
              updateMutation.mutate(
                { id: editingProduct.id, data },
                { onSuccess: () => close() },
              );
            }}
          >
            <FieldGroup>
              <TextField name="name" label="Name" placeholder="Product name" />
              <TextField name="price" label="Price" type="number" placeholder="0.00" />
              <TextField name="sku" label="SKU" placeholder="SKU-001" />
              <TextField name="description" label="Description" placeholder="Product description" />
              <TextField name="image" label="Image URL" placeholder="https://..." />
              <TextField name="unit" label="Unit" placeholder="e.g. kg, piece" />
            </FieldGroup>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={close}>Cancel</Button>
              <Button type="submit" isLoading={updateMutation.isPending}>Save</Button>
            </div>
          </Form>
        )}
      />
    </div>
  );
};
