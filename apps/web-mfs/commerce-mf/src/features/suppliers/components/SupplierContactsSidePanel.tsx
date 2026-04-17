import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { ClipboardList, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { useSupplierContacts } from '@/hooks/useSupplierContacts';
import { AddSupplierContactDialog } from '../forms/AddSupplierContactDialog';

interface SupplierContactsSidePanelProps {
  supplierId: string;
  selectedContactId: string | null;
  onSelectContact: (contactId: string | null) => void;
}

export const SupplierContactsSidePanel = ({
  supplierId,
  selectedContactId,
  onSelectContact,
}: SupplierContactsSidePanelProps) => {
  const addContactDialog = useDialog();
  const { data: contacts = [], isLoading } = useSupplierContacts(supplierId);

  useEffect(() => {
    if (!selectedContactId) return;
    if (!contacts.some((contact) => contact.id === selectedContactId)) {
      onSelectContact(null);
    }
  }, [contacts, selectedContactId, onSelectContact]);

  return (
    <>
      <PageContentPanel
        className="w-80"
        header={`Contacts (${contacts.length})`}
        isLoading={isLoading}
        contentClassName={!isLoading && contacts.length === 0 ? 'flex items-center justify-center p-3' : undefined}
        actions={
          <Button size="sm" onClick={addContactDialog.open} startAdornment={<Plus className="size-4" />}>
            Add Contact
          </Button>
        }
        content={
          contacts.length === 0 ? (
            <Empty
              icon={<ClipboardList />}
              title="No contacts"
              description="Add your first supplier contact."
              className="py-12"
            />
          ) : (
            <div className="p-2 space-y-2">
              {contacts.map((contact) => (
                <SidePanelListItem
                  key={contact.id}
                  active={selectedContactId === contact.id}
                  onClick={() => onSelectContact(contact.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium truncate">{contact.name}</div>
                    {contact.isPrimary ? <Badge variant="secondary">Primary</Badge> : null}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {contact.designation ?? contact.email ?? contact.alternateEmail ?? contact.phone ?? contact.alternatePhone ?? 'No additional details'}
                  </div>
                </SidePanelListItem>
              ))}
            </div>
          )
        }
      />

      <Dialog
        handle={addContactDialog}
        title="Add Contact"
        description="Add a contact for this supplier."
        content={(close) => <AddSupplierContactDialog supplierId={supplierId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
