import { LE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { CompactSwitch } from '@vritti/quantum-ui/Switch';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Building2, Info, ListChecks } from 'lucide-react';
import type React from 'react';
import { usePurchaseSettings, useUpdatePurchaseSettings } from '@/hooks/legal-entity/purchases';
import type { PurchaseSettingsRow } from '@/schemas/purchases';

const RULES = [
  {
    key: 'supplierItemsRequired',
    label: 'Supplier Items Required',
    description: 'Buy an item only from suppliers that have it set up at the site',
  },
  {
    key: 'updateSupplierItemsFromOrders',
    label: 'Update from Orders',
    description: 'A sent order sets up the supplier items it orders at the site, with the price it paid',
  },
] as const;

interface PurchasingRulesListProps {
  onClose: () => void;
}

const GRID = 'grid grid-cols-[minmax(0,1fr)_repeat(2,11rem)] gap-4';

// Each of the legal entity's sites with its two purchasing rules, switched on or off one at a time
const PurchasingRulesList: React.FC<PurchasingRulesListProps> = ({ onClose }) => {
  const { data: rows, isLoading } = usePurchaseSettings();
  const updateMutation = useUpdatePurchaseSettings();

  // Switches one rule of one site
  const handleChange = (row: PurchaseSettingsRow, key: (typeof RULES)[number]['key'], checked: boolean) =>
    updateMutation.mutate({ siteId: row.siteId, [key]: checked });

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !rows || rows.length === 0 ? (
          <Empty icon={<Building2 />} title="No sites" description="The legal entity has no sites yet." />
        ) : (
          <div className="flex flex-col divide-y">
            <div className={`${GRID} items-center pb-2`}>
              <Typography variant="caption" intent="muted" className="font-medium">
                Site
              </Typography>
              {RULES.map((rule) => (
                <Tooltip key={rule.key} content={rule.description}>
                  <span className="flex items-center justify-center gap-1">
                    <Typography variant="caption" intent="muted" className="font-medium">
                      {rule.label}
                    </Typography>
                    <Info className="size-3.5 text-muted-foreground" />
                  </span>
                </Tooltip>
              ))}
            </div>
            {rows.map((row) => (
              <div key={row.siteId} className={`${GRID} items-center py-3`}>
                <div className="flex min-w-0 flex-col">
                  <Typography variant="body2" className="truncate">
                    {row.siteName}
                  </Typography>
                  <Typography variant="caption" intent="muted" className="font-mono">
                    {row.siteCode}
                  </Typography>
                </div>
                {RULES.map((rule) => (
                  <div key={rule.key} className="flex justify-center">
                    <CompactSwitch
                      checked={row[rule.key]}
                      permission={LE_PURCHASES.settings.edit}
                      disabled={updateMutation.isPending && updateMutation.variables?.siteId === row.siteId}
                      onCheckedChange={(checked) => handleChange(row, rule.key, checked)}
                      aria-label={`${rule.label} at ${row.siteName}`}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </>
  );
};

// Opens the purchasing rules of the legal entity's sites, like SAP's source list requirement and info update per plant
export const PurchasingRulesButton: React.FC = () => {
  const dialog = useDialog();
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        permission={LE_PURCHASES.settings.view}
        startAdornment={<ListChecks className="size-4" />}
        onClick={dialog.open}
      >
        Purchasing Rules
      </Button>
      <Dialog
        handle={dialog}
        icon={ListChecks}
        title="Purchasing Rules"
        description="How each site chooses its suppliers, and whether its orders keep the supplier items up to date."
        className="max-w-3xl"
        content={(close) => <PurchasingRulesList onClose={close} />}
      />
    </>
  );
};
