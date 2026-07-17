import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { DetailHeader } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Building2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMPANY_IDENTIFIERS_TABLE_KEY, useCompanyById, useDeleteCompany } from '@/hooks/organization/companies';
import { EditCompanyDialog } from './forms/EditCompanyDialog';
import { AddressesTab } from './tabs/AddressesTab';
import { IdentifiersTab } from './tabs/IdentifiersTab';
import { OverviewTab } from './tabs/OverviewTab';
import { PeopleTab } from './tabs/PeopleTab';
import { RegistrationsTab } from './tabs/RegistrationsTab';

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
      <DetailHeader
        title={company.displayName}
        badges={
          <Badge
            variant={company.isActive ? 'secondary' : 'outline'}
            className={company.isActive ? 'bg-success/15 text-success' : ''}
          >
            {company.isActive ? 'Active' : 'Inactive'}
          </Badge>
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
            content: <AddressesTab partyId={company.id} />,
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
            content: <RegistrationsTab companyId={company.id} />,
          },
          {
            value: 'identifiers',
            label: 'Identifiers',
            permission: ORG_COMPANIES.identifiers.view,
            content: (
              <IdentifiersTab
                partyId={company.id}
                permissions={ORG_COMPANIES.identifiers}
                slug={`commerce-org-company-${company.id}-identifiers`}
                queryKey={COMPANY_IDENTIFIERS_TABLE_KEY(company.id)}
                emptyDescription="Record this company's identifiers like CIN, LEI, or DUNS."
              />
            ),
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
        warning="This company is referenced by suppliers or other records and cannot be deleted."
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
