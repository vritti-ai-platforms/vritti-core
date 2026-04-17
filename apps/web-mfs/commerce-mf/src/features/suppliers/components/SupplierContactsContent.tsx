import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { CheckCircle2, Pencil, Trash2, UserCircle2 } from 'lucide-react';
import { useMemo } from 'react';
import { useDeleteSupplierContact } from '@/hooks/useDeleteSupplierContact';
import { useMarkPrimarySupplierContact } from '@/hooks/useMarkPrimarySupplierContact';
import { useSupplierContacts } from '@/hooks/useSupplierContacts';
import { EditSupplierContactDialog } from '../forms/EditSupplierContactDialog';

interface SupplierContactsContentProps {
  supplierId: string;
  selectedContactId: string | null;
  onSelectContact: (contactId: string | null) => void;
}

export const SupplierContactsContent = ({
  supplierId,
  selectedContactId,
  onSelectContact,
}: SupplierContactsContentProps) => {
  const confirm = useConfirm();
  const editDialog = useDialog();
  const { data: contacts = [] } = useSupplierContacts(supplierId);
  const deleteContactMutation = useDeleteSupplierContact(supplierId);
  const markPrimaryMutation = useMarkPrimarySupplierContact(supplierId);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId],
  );

  async function handleDelete(contactId: string, name: string) {
    const confirmed = await confirm({
      title: `Delete "${name}"?`,
      description: 'This contact will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteContactMutation.mutate(contactId, {
        onSuccess: () => onSelectContact(null),
      });
    }
  }

  async function handleMarkPrimary(contactId: string, name: string) {
    const confirmed = await confirm({
      title: `Make "${name}" primary?`,
      description: 'Current primary contact will be replaced.',
      confirmLabel: 'Set Primary',
    });
    if (confirmed) {
      markPrimaryMutation.mutate(contactId);
    }
  }

  if (!selectedContact) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty
          icon={<UserCircle2 />}
          title="No contact selected"
          description="Select a contact from the left panel."
          className="py-8"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">{selectedContact.name}</h3>
          {selectedContact.isPrimary ? <Badge variant="secondary">Primary</Badge> : null}
        </div>
        <div className="flex items-center gap-2">
          {!selectedContact.isPrimary ? (
            <Button
              size="sm"
              variant="outline"
              startAdornment={<CheckCircle2 className="size-3.5" />}
              onClick={() => handleMarkPrimary(selectedContact.id, selectedContact.name)}
              isLoading={markPrimaryMutation.isPending}
            >
              Mark as Primary
            </Button>
          ) : null}
          <Button size="sm" variant="outline" startAdornment={<Pencil className="size-3.5" />} onClick={editDialog.open}>
            Edit Contact
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            startAdornment={<Trash2 className="size-3.5" />}
            onClick={() => handleDelete(selectedContact.id, selectedContact.name)}
            isLoading={deleteContactMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Name" value={selectedContact.name} />
            <DetailField label="Designation" value={selectedContact.designation ?? '—'} />
            <DetailField label="Phone" value={selectedContact.phone ?? '—'} />
            <DetailField label="Alternate Mobile" value={selectedContact.alternateMobile ?? '—'} />
            <DetailField label="Email" value={selectedContact.email ?? '—'} />
            <DetailField label="Alternate Email" value={selectedContact.alternateEmail ?? '—'} />
            <DetailField label="Status" value={selectedContact.isActive ? 'Active' : 'Inactive'} />
            <DetailField label="Created" value={new Date(selectedContact.createdAt).toLocaleDateString()} />
            <div className="col-span-2">
              <DetailField label="Notes" value={selectedContact.notes ?? '—'} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        handle={editDialog}
        title="Edit Contact"
        description="Update supplier contact details."
        content={(close) => (
          <EditSupplierContactDialog
            supplierId={supplierId}
            contact={selectedContact}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
