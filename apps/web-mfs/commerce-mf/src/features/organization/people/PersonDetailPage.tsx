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
          <Button
            variant="outline"
            size="sm"
            permission={ORG_PEOPLE.edit}
            startAdornment={<Pencil className="size-4" />}
            onClick={editDialog.open}
          >
            Edit
          </Button>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: ORG_PEOPLE.view,
            content: <OverviewTab person={person} />,
          },
          {
            value: 'addresses',
            label: 'Addresses',
            permission: ORG_PEOPLE.addresses.view,
            content: <AddressesTab partyId={person.id} />,
          },
          {
            value: 'companies',
            label: 'Companies',
            permission: ORG_PEOPLE.view,
            content: <CompaniesTab partyId={person.id} />,
          },
          {
            value: 'identifiers',
            label: 'Identifiers',
            permission: ORG_PEOPLE.identifiers.view,
            content: (
              <IdentifiersTab
                partyId={person.id}
                permissions={ORG_PEOPLE.identifiers}
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
        permission={ORG_PEOPLE.delete}
        onClick={handleDelete}
        disabled={!person.canDelete || deleteMutation.isPending}
        warning="This person is linked to one or more companies (or a supplier) and cannot be deleted. Remove those links first."
        showWarning={!person.canDelete}
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
