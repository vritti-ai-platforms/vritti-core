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
import { useCreateStation, useDeleteStation, useStations, useUpdateStation } from '../../hooks';
import { type CreateStationInput, type Station, type UpdateStationInput, createStationSchema, updateStationSchema } from '../../schemas';

export const StationsPage = () => {
  const { businessUnitId } = useCommerceContext();
  const { data: stations = [], isLoading } = useStations(businessUnitId);
  const createMutation = useCreateStation();
  const updateMutation = useUpdateStation();
  const deleteMutation = useDeleteStation();

  const addDialog = useDialog();
  const editDialog = useDialog();
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  const addForm = useForm<CreateStationInput>({
    resolver: zodResolver(createStationSchema),
    defaultValues: { name: '' },
  });

  const editForm = useForm<UpdateStationInput>({
    resolver: zodResolver(updateStationSchema),
  });

  const columns: ColumnDef<Station, unknown>[] = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }: { row: { original: Station } }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      { accessorKey: 'sortOrder', header: 'Sort Order' },
      {
        id: 'actions',
        header: '',
        cell: ({ row }: { row: { original: Station } }) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingStation(row.original);
                editForm.reset({ name: row.original.name });
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
    slug: 'stations',
    label: 'station',
    serverState: { result: stations, count: stations.length },
    enableRowSelection: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stations"
        description="Manage kitchen and preparation stations"
        actions={
          <Button onClick={addDialog.open}>
            <Plus className="size-4 mr-2" />
            Add Station
          </Button>
        }
      />

      <DataTable table={table} isLoading={isLoading} />

      {/* Add Station Dialog */}
      <Dialog
        open={addDialog.isOpen}
        onOpenChange={(v) => { if (!v) addDialog.close(); }}
        title="Add Station"
        description="Create a new preparation station"
        content={(close) => (
          <Form<CreateStationInput>
            form={addForm}
            onSubmit={(data) => {
              createMutation.mutate(
                { ...data, businessUnitId },
                { onSuccess: () => { addForm.reset(); close(); } },
              );
            }}
          >
            <FieldGroup>
              <TextField name="name" label="Name" placeholder="Station name" />
            </FieldGroup>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={close}>Cancel</Button>
              <Button type="submit" isLoading={createMutation.isPending}>Create</Button>
            </div>
          </Form>
        )}
      />

      {/* Edit Station Dialog */}
      <Dialog
        open={editDialog.isOpen}
        onOpenChange={(v) => { if (!v) editDialog.close(); }}
        title="Edit Station"
        description="Update station details"
        content={(close) => (
          <Form<UpdateStationInput>
            form={editForm}
            onSubmit={(data) => {
              if (!editingStation) return;
              updateMutation.mutate(
                { id: editingStation.id, data },
                { onSuccess: () => close() },
              );
            }}
          >
            <FieldGroup>
              <TextField name="name" label="Name" placeholder="Station name" />
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
