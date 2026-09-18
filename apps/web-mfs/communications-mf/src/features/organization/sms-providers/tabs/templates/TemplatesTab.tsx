import { useQueryClient } from '@tanstack/react-query';
import { ORG_SMS_PROVIDERS } from '@vritti/communications-permissions/sms-providers';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateTimeCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { LayoutTemplate, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import {
  SMS_PROVIDER_TEMPLATES_KEY,
  useRefreshSmsProviderTemplate,
  useSmsProviderTemplates,
} from '@/hooks/organization/sms-provider-templates';
import { useAvailableSmsProviders } from '@/hooks/organization/sms-providers';
import type { SmsProviderTemplateData } from '@/schemas/sms-provider-templates';
import type { SmsProviderData } from '@/schemas/sms-providers';
import { AddTemplateDialog } from './forms/AddTemplateDialog';
import { RemoveTemplateDialog } from './forms/RemoveTemplateDialog';
import { TemplateDetailsDialog } from './forms/TemplateDetailsDialog';

interface TemplatesTabProps {
  provider: SmsProviderData;
}

/**
 * Templates registered against this provider.
 *
 * These rows are Vritti's, not a live vendor read — MSG91 has no endpoint that lists the SMS
 * templates on an account, only one that fetches a template you can already name. So the list is
 * curated here; each row was confirmed with MSG91 when it was added, and Refresh re-reads one.
 */
export const TemplatesTab = ({ provider }: TemplatesTabProps) => {
  const queryClient = useQueryClient();
  const addDialog = useDialog();
  const { data: response, isLoading } = useSmsProviderTemplates(provider.id);
  const { data: capabilities } = useAvailableSmsProviders();

  // Destructured because TanStack keeps `mutate` stable while the mutation object itself changes
  // identity on every state transition — the columns memo below depends on it
  const { mutate: refreshTemplate } = useRefreshSmsProviderTemplate(provider.id);

  // Every column carries an explicit size: DataTable takes the table's minWidth from their total
  const columns = useMemo<ColumnDef<SmsProviderTemplateData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <StringCell value={row.original.name} />,
        enableSorting: false,
        size: 240,
      },
      {
        accessorKey: 'templateId',
        header: 'Template ID',
        cell: ({ row }) => <StringCell value={row.original.templateId} mono />,
        enableSorting: false,
        size: 260,
      },
      {
        accessorKey: 'syncedAt',
        header: 'Last synced',
        cell: ({ row }) => <DateTimeCell value={row.original.syncedAt} />,
        enableSorting: false,
        size: 190,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'details',
                icon: LayoutTemplate,
                label: 'View details',
                permission: ORG_SMS_PROVIDERS.templates.view,
                dialog: {
                  title: row.original.name,
                  description: 'What MSG91 returned for this template when it was last read.',
                  content: () => <TemplateDetailsDialog template={row.original} />,
                },
              },
              {
                id: 'refresh',
                icon: RefreshCw,
                label: 'Refresh from MSG91',
                permission: ORG_SMS_PROVIDERS.templates.view,
                onClick: () => refreshTemplate(row.original.id),
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Remove',
                variant: 'destructive',
                permission: ORG_SMS_PROVIDERS.templates.delete,
                dialog: {
                  title: 'Remove template?',
                  description: 'This removes it from Vritti only.',
                  content: (close) => (
                    <RemoveTemplateDialog
                      providerId={provider.id}
                      template={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 70,
      },
    ],
    [provider.id, refreshTemplate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'communications-org-sms-provider-templates',
    label: 'template',
    serverState: response,
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SMS_PROVIDER_TEMPLATES_KEY(provider.id) }),
  });

  // Whether templates apply is the transport's answer, not a hardcoded provider code — the server
  // refuses the operation for a transport without fetchTemplate, and this mirrors that decision
  // rather than restating it. Undefined while capabilities load, so the table renders optimistically.
  const supportsTemplates = capabilities?.find((c) => c.code === provider.provider)?.supportsTemplates;
  if (supportsTemplates === false) {
    return (
      <Alert
        variant="info"
        title="No templates for this provider"
        description={`${provider.provider.toLowerCase()} does not send through message templates, so there is nothing to register here.`}
      />
    );
  }

  const addButton = (
    <Button
      size="sm"
      startAdornment={<Plus className="size-4" />}
      permission={ORG_SMS_PROVIDERS.templates.add}
      onClick={addDialog.open}
    >
      Add template
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <Alert
        variant="info"
        title="Templates are added by ID"
        description="This provider has no API that lists the templates on an account, so Vritti keeps the list. Paste a template ID from the provider's panel and it is checked against your account before being saved."
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_SMS_PROVIDERS.templates.view}
        enableViews={false}
        toolbarActions={{ actions: addButton }}
        emptyStateConfig={{
          icon: LayoutTemplate,
          title: 'No templates yet',
          description: 'Register a template so apps can send sign-in codes through this provider.',
          action: addButton,
        }}
      />

      <Dialog
        handle={addDialog}
        icon={LayoutTemplate}
        title="Add template"
        description="Register a template against this provider."
        content={(close) => <AddTemplateDialog providerId={provider.id} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
