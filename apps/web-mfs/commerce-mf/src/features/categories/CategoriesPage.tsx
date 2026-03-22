import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DataTable, type ColumnDef, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { FieldGroup, Form } from '@vritti/quantum-ui/Form';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCommerceContext } from '../../context/CommerceContext';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '../../hooks';
import { type Category, type CreateCategoryInput, type UpdateCategoryInput, createCategorySchema, updateCategorySchema } from '../../schemas';

export const CategoriesPage = () => {
  const { businessUnitId } = useCommerceContext();
  const { data: categories = [], isLoading } = useCategories(businessUnitId);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const addDialog = useDialog();
  const editDialog = useDialog();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const addForm = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: '' },
  });

  const editForm = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
  });

  const columns: ColumnDef<Category, unknown>[] = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }: { row: { original: Category } }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      { accessorKey: 'sortOrder', header: 'Sort Order' },
      {
        id: 'actions',
        header: '',
        cell: ({ row }: { row: { original: Category } }) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingCategory(row.original);
                editForm.reset({ name: row.original.name, image: row.original.image ?? undefined });
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
    [editDialog, editForm, deleteMutation],
  );

  const { table } = useDataTable({
    columns,
    slug: 'categories',
    label: 'category',
    serverState: { result: categories, count: categories.length },
    enableRowSelection: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage product categories"
        actions={
          <Button onClick={addDialog.open}>
            <Plus className="size-4 mr-2" />
            Add Category
          </Button>
        }
      />

      <DataTable table={table} isLoading={isLoading} />

      {/* Add Category Dialog */}
      <Dialog
        open={addDialog.isOpen}
        onOpenChange={(v) => { if (!v) addDialog.close(); }}
        title="Add Category"
        description="Create a new product category"
        content={(close) => (
          <Form<CreateCategoryInput>
            form={addForm}
            onSubmit={(data) => {
              createMutation.mutate(
                { ...data, businessUnitId },
                { onSuccess: () => { addForm.reset(); close(); } },
              );
            }}
          >
            <FieldGroup>
              <TextField name="name" label="Name" placeholder="Category name" />
              <TextField name="image" label="Image URL" placeholder="https://..." />
            </FieldGroup>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={close}>Cancel</Button>
              <Button type="submit" isLoading={createMutation.isPending}>Create</Button>
            </div>
          </Form>
        )}
      />

      {/* Edit Category Dialog */}
      <Dialog
        open={editDialog.isOpen}
        onOpenChange={(v) => { if (!v) editDialog.close(); }}
        title="Edit Category"
        description="Update category details"
        content={(close) => (
          <Form<UpdateCategoryInput>
            form={editForm}
            onSubmit={(data) => {
              if (!editingCategory) return;
              updateMutation.mutate(
                { id: editingCategory.id, data },
                { onSuccess: () => close() },
              );
            }}
          >
            <FieldGroup>
              <TextField name="name" label="Name" placeholder="Category name" />
              <TextField name="image" label="Image URL" placeholder="https://..." />
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
