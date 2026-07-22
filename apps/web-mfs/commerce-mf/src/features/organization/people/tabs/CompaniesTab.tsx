import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { type ColumnDef, DataTable, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Building2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { usePersonCompanies } from '@/hooks/organization/people';
import type { PersonCompanyRow } from '@/schemas/people';

interface CompaniesTabProps {
  partyId: string;
}

export const CompaniesTab: React.FC<CompaniesTabProps> = ({ partyId }) => {
  const { data: response, isLoading } = usePersonCompanies(partyId);

  const columns = useMemo<ColumnDef<PersonCompanyRow>[]>(
    () => [
      {
        accessorKey: 'companyName',
        header: 'Company',
        cell: ({ row }) => <StringCell value={row.original.companyName} />,
      },
      {
        accessorKey: 'jobTitle',
        header: 'Job Title',
        cell: ({ row }) => <StringCell value={row.original.jobTitle ?? '—'} />,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-org-person-${partyId}-companies`,
    label: 'company',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      permission={ORG_PEOPLE.view}
      emptyStateConfig={{
        icon: Building2,
        title: 'No companies',
        description: "This person isn't linked to any company yet.",
      }}
    />
  );
};
