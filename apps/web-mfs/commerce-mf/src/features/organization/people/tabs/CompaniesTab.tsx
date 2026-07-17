import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { countryFlag } from '@vritti/quantum-ui/selects/iso-country';
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
        accessorKey: 'countryCode',
        header: 'Country',
        cell: ({ row }) =>
          row.original.countryCode ? (
            <Badge variant="secondary">
              {countryFlag(row.original.countryCode)} {row.original.countryCode}
            </Badge>
          ) : (
            '—'
          ),
      },
      {
        accessorKey: 'jobTitle',
        header: 'Job Title',
        cell: ({ row }) => <StringCell value={row.original.jobTitle ?? '—'} />,
      },
      {
        accessorKey: 'isPrimary',
        header: 'Primary',
        cell: ({ row }) =>
          row.original.isPrimary ? (
            <Badge variant="secondary" className="bg-success/15 text-success">
              Primary
            </Badge>
          ) : (
            '—'
          ),
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
