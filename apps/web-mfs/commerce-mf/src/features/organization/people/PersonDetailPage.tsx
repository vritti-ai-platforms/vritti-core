import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeletePerson, usePersonById, usePersonCounts } from '@/hooks/organization/people';
import { AddressesTab } from '../party/tabs/addresses/AddressesTab';
import { BankAccountsTab } from '../party/tabs/bank-accounts/BankAccountsTab';
import { CommunicationsTab } from '../party/tabs/communications/CommunicationsTab';
import { IdentifiersTab } from '../party/tabs/identifiers/IdentifiersTab';
import { LicensesTab } from '../party/tabs/licenses/LicensesTab';
import { RegistrationsTab } from '../party/tabs/registrations/RegistrationsTab';
import { SocialProfilesTab } from '../party/tabs/social-profiles/SocialProfilesTab';
import { EditPersonDialog } from './forms/EditPersonDialog';
import { personBindings } from './party-bindings';
import { CompaniesTab } from './tabs/CompaniesTab';
import { OverviewTab } from './tabs/OverviewTab';
import { WishlistTab } from './tabs/WishlistTab';

export const PersonDetailPage = () => {
  const { id } = useSlugParams('personSlug');
  const navigate = useNavigate();
  const { data: person } = usePersonById(id);
  const { data: counts, isLoading: countsLoading } = usePersonCounts(id);
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
        description={
          counts
            ? `${pluralize('company', counts.companyCount, true)} · ${counts.identifierCount} identity ${pluralize('document', counts.identifierCount)}`
            : undefined
        }
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
            count: counts?.addressCount,
            countLoading: countsLoading,
            permission: ORG_PEOPLE.addresses.view,
            content: <AddressesTab partyId={person.id} binding={personBindings.addresses} />,
          },
          {
            value: 'communications',
            label: 'Communications',
            count: counts?.communicationCount,
            countLoading: countsLoading,
            permission: ORG_PEOPLE.communications.view,
            content: <CommunicationsTab partyId={person.id} binding={personBindings.communications} />,
          },
          {
            value: 'social-profiles',
            label: 'Social Profiles',
            count: counts?.socialProfileCount,
            countLoading: countsLoading,
            permission: ORG_PEOPLE.socialProfiles.view,
            content: <SocialProfilesTab partyId={person.id} binding={personBindings.socialProfiles} />,
          },
          {
            value: 'companies',
            label: 'Companies',
            count: counts?.companyCount,
            countLoading: countsLoading,
            permission: ORG_PEOPLE.companies.view,
            content: <CompaniesTab partyId={person.id} />,
          },
          {
            value: 'registrations',
            label: 'Tax Registrations',
            count: counts?.registrationCount,
            countLoading: countsLoading,
            permission: ORG_PEOPLE.registrations.view,
            content: <RegistrationsTab partyId={person.id} binding={personBindings.registrations} />,
          },
          {
            value: 'licenses',
            label: 'Licenses',
            count: counts?.licenseCount,
            countLoading: countsLoading,
            permission: ORG_PEOPLE.licenses.view,
            content: <LicensesTab partyId={person.id} binding={personBindings.licenses} />,
          },
          {
            value: 'bank-accounts',
            label: 'Bank Accounts',
            count: counts?.bankAccountCount,
            countLoading: countsLoading,
            permission: ORG_PEOPLE.bankAccounts.view,
            content: <BankAccountsTab partyId={person.id} binding={personBindings.bankAccounts} />,
          },
          {
            value: 'wishlist',
            label: 'Wishlist',
            count: counts?.wishlistCount,
            countLoading: countsLoading,
            permission: ORG_PEOPLE.wishlist.view,
            content: <WishlistTab partyId={person.id} />,
          },
          {
            value: 'identifiers',
            label: 'Identifiers',
            count: counts?.identifierCount,
            countLoading: countsLoading,
            permission: ORG_PEOPLE.identifiers.view,
            content: <IdentifiersTab partyId={person.id} binding={personBindings.identifiers} />,
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
