import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Coins, Plus } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CatalogData } from '@/schemas/catalogs';
import type { CatalogsBinding } from '../bindings';
import { CurrencyCard } from '../components/CurrencyCard';
import { AddCurrencyDialog } from '../forms/AddCurrencyDialog';

interface CurrenciesTabProps {
  binding: CatalogsBinding;
  catalog: CatalogData;
}

// Which currencies this catalog prices in, and how much of it each one covers
export const CurrenciesTab: React.FC<CurrenciesTabProps> = ({ binding, catalog }) => {
  const catalogId = catalog.id;
  const { data: currencies = [], isLoading } = binding.useCurrencies(catalogId);
  const navigate = useNavigate();
  const addDialog = useDialog();
  const confirm = useConfirm();
  const removeMutation = binding.useRemoveCurrency();

  // This tab only renders on `…/<catalog>/currencies`, so the currency hangs straight off the URL
  const openCurrency = (currencyCode: string) => navigate(currencyCode, { relative: 'path' });

  const handleRemove = async (currencyCode: string) => {
    const ok = await confirm({
      title: `Remove ${currencyCode}?`,
      description: 'This catalog stops offering that currency. Nothing already priced in it is touched.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (ok) removeMutation.mutate({ catalogId, currencyCode });
  };

  const addButton = (
    <Button
      size="sm"
      startAdornment={<Plus className="size-4" />}
      onClick={addDialog.open}
      permission={binding.permissions.currencies.add}
      // The currency list belongs to the catalog, so only the workspace that owns it may change which currencies exist
      // — a wider scope's price list is priced here, not edited here
      disabled={!catalog.canEdit}
      disabledTip="This price list belongs to a wider workspace. Switch to the workspace that owns it to add a currency."
    >
      Add Currency
    </Button>
  );

  return (
    // The tab wrapper stretches its direct child, so the column takes that height and the card grid scrolls inside it —
    // otherwise one row of cards is stretched down the whole viewport
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      {isLoading ? (
        <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : currencies.length === 0 ? (
        <Empty
          icon={<Coins />}
          title="No currencies yet"
          description="A catalog prices in the currencies you give it. Add one to start pricing its listings."
          action={addButton}
        />
      ) : (
        <>
          <div className="flex justify-end">{addButton}</div>
          <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currencies.map((currency) => (
              <CurrencyCard
                key={currency.currencyCode}
                currency={currency}
                editPermission={binding.permissions.currencies.delete}
                canEdit={catalog.canEdit}
                isRemoving={removeMutation.isPending}
                onOpen={() => openCurrency(currency.currencyCode)}
                onRemove={() => handleRemove(currency.currencyCode)}
              />
            ))}
          </div>
        </>
      )}

      <Dialog
        handle={addDialog}
        icon={Coins}
        title="Add Currency"
        description="Offer another currency on this price list. Nothing is priced in it until you set prices."
        content={(close) => (
          <AddCurrencyDialog
            binding={binding}
            catalogId={catalogId}
            existingCodes={currencies.map((currency) => currency.currencyCode)}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
