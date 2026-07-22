import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Building2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyById, useDeleteCompany } from '@/hooks/organization/companies';
import { AddressesTab } from '../party/tabs/AddressesTab';
import { BankAccountsTab } from '../party/tabs/BankAccountsTab';
import { CommunicationsTab } from '../party/tabs/CommunicationsTab';
import { IdentifiersTab } from '../party/tabs/IdentifiersTab';
import { LicensesTab } from '../party/tabs/LicensesTab';
import { RegistrationsTab } from '../party/tabs/RegistrationsTab';
import { SocialProfilesTab } from '../party/tabs/SocialProfilesTab';
import { EditCompanyDialog } from './forms/EditCompanyDialog';
import { companyBindings } from './party-bindings';
import { OverviewTab } from './tabs/OverviewTab';
import { PeopleTab } from './tabs/PeopleTab';

export const CompanyDetailPage = () => {
  const { id } = useSlugParams('companySlug');
  const navigate = useNavigate();
  const { data: company } = useCompanyById(id);
  const [activeTab, setActiveTab] = useState('overview');
  const editDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteCompany();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${company.displayName}"?`,
      description: 'This company and its linked people and tax registrations will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(company.id, { onSuccess: () => navigate('..') });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={company.displayName}
        description={company.legalName ?? undefined}
        titleSlot={
          <Badge variant={company.isActive ? 'success' : 'outline'}>{company.isActive ? 'Active' : 'Inactive'}</Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            permission={ORG_COMPANIES.edit}
            startAdornment={<Pencil className="size-3.5" />}
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
            permission: ORG_COMPANIES.view,
            content: <OverviewTab company={company} />,
          },
          {
            value: 'addresses',
            label: 'Addresses',
            permission: ORG_COMPANIES.addresses.view,
            content: <AddressesTab partyId={company.id} binding={companyBindings.addresses} />,
          },
          {
            value: 'communications',
            label: 'Communications',
            permission: ORG_COMPANIES.communications.view,
            content: <CommunicationsTab partyId={company.id} binding={companyBindings.communications} />,
          },
          {
            value: 'social-profiles',
            label: 'Social Profiles',
            permission: ORG_COMPANIES.socialProfiles.view,
            content: <SocialProfilesTab partyId={company.id} binding={companyBindings.socialProfiles} />,
          },
          {
            value: 'people',
            label: 'People',
            permission: ORG_COMPANIES.people.view,
            content: <PeopleTab companyId={company.id} />,
          },
          {
            value: 'registrations',
            label: 'Tax Registrations',
            permission: ORG_COMPANIES.registrations.view,
            content: <RegistrationsTab partyId={company.id} binding={companyBindings.registrations} />,
          },
          {
            value: 'licenses',
            label: 'Licenses',
            permission: ORG_COMPANIES.licenses.view,
            content: <LicensesTab partyId={company.id} binding={companyBindings.licenses} />,
          },
          {
            value: 'bank-accounts',
            label: 'Bank Accounts',
            permission: ORG_COMPANIES.bankAccounts.view,
            content: <BankAccountsTab partyId={company.id} binding={companyBindings.bankAccounts} />,
          },
          {
            value: 'identifiers',
            label: 'Identifiers',
            permission: ORG_COMPANIES.identifiers.view,
            content: <IdentifiersTab partyId={company.id} binding={companyBindings.identifiers} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <DangerZone
        title="Delete this company"
        description="This action cannot be undone. The company and its linked people and tax registrations will be permanently removed."
        buttonText="Delete Company"
        permission={ORG_COMPANIES.delete}
        onClick={handleDelete}
        disabled={!company.canDelete || deleteMutation.isPending}
        isLoading={deleteMutation.isPending}
        warning="This company is linked to a supplier and cannot be deleted. Remove the supplier record first."
        showWarning={!company.canDelete}
      />

      <Dialog
        handle={editDialog}
        icon={Building2}
        title="Edit Company"
        description="Update the details for this company."
        className="max-w-3xl"
        content={(close) => <EditCompanyDialog company={company} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
