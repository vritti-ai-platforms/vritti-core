import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PERSON_IDENTIFIERS_KEY,
  useDeletePerson,
  usePersonById,
  usePersonCompanies,
  usePersonIdentifiers,
} from '@/hooks/organization/people';
import { EditPersonDialog } from './forms/EditPersonDialog';
import { AddressesTab } from './tabs/AddressesTab';
import { CompaniesTab } from './tabs/CompaniesTab';
import { IdentifiersTab } from './tabs/IdentifiersTab';
import { OverviewTab } from './tabs/OverviewTab';

export const PersonDetailPage = () => {
  const { id } = useSlugParams('personSlug');
  const navigate = useNavigate();
  const { data: person } = usePersonById(id);
  const { data: companies } = usePersonCompanies(id);
  const { data: identifiers } = usePersonIdentifiers(id);
  const companyCount = companies?.count ?? 0;
  const idCount = identifiers?.count ?? 0;
  const [activeTab, setActiveTab] = useState('overview');
  const editDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeletePerson();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${person.displayName}"?`,
      description: 'This person will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(person.id, { onSuccess: () => navigate('..') });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={person.displayName}
        description={`${companyCount} ${companyCount === 1 ? 'company' : 'companies'} · ${idCount} identity ${idCount === 1 ? 'document' : 'documents'}`}
        titleSlot={
          <Badge variant={person.isActive ? 'success' : 'outline'}>{person.isActive ? 'Active' : 'Inactive'}</Badge>
        }
        actions={
          <Button variant="outline" size="sm" startAdornment={<Pencil className="size-4" />} onClick={editDialog.open}>
            Edit
          </Button>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab person={person} />,
          },
          {
            value: 'addresses',
            label: 'Addresses',
            content: <AddressesTab partyId={person.id} />,
          },
          {
            value: 'companies',
            label: 'Companies',
            content: <CompaniesTab partyId={person.id} />,
          },
          {
            value: 'identifiers',
            label: 'Identifiers',
            content: (
              <IdentifiersTab
                partyId={person.id}
                permission={ORG_PEOPLE.view}
                slug={`commerce-org-person-${person.id}-identifiers`}
                queryKey={PERSON_IDENTIFIERS_KEY(person.id)}
                emptyDescription="Record this person's identity documents like PAN, Aadhaar, or passport."
              />
            ),
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <DangerZone
        title="Delete this person"
        description="This action cannot be undone. This person will be permanently removed."
        buttonText="Delete Person"
        onClick={handleDelete}
        disabled={!person.canDelete || deleteMutation.isPending}
        warning={!person.canDelete ? 'This person is referenced by other records and cannot be deleted.' : undefined}
      />

      <Dialog
        handle={editDialog}
        icon={Users}
        title="Edit Person"
        description="Update the details for this person."
        className="max-w-3xl"
        content={(close) => <EditPersonDialog person={person} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
