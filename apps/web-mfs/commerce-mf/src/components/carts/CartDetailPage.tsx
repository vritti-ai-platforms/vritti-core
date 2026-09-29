import { Badge } from '@vritti/quantum-ui/Badge';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { useConfirm, useFormatters, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemsTab } from './tabs/ItemsTab';
import { OverviewTab } from './tabs/OverviewTab';
import type { CartsBinding } from './types';

/**
 * One basket, and what is in it.
 *
 * Items are priced through the channel this workspace sells from, resolved per read — so a basket
 * reads the same at the till as it does on the website, and one this workspace cannot price comes
 * back whole with its lines flagged rather than not at all.
 */
export const CartDetailPage: React.FC<{ binding: CartsBinding }> = ({ binding }) => {
  const { permissions } = binding;
  const { id } = useSlugParams('cartSlug');
  const navigate = useNavigate();
  const fmt = useFormatters();

  const { data: cart } = binding.useCart(id);
  const { data: lines } = binding.useCartItems(id);
  const confirm = useConfirm();
  const closeMutation = binding.useCloseCart();

  const handleClose = async () => {
    const confirmed = await confirm({
      title: `Close ${cart.partyName ?? 'this'}'s basket?`,
      description: `${pluralize('item', lines.items.length, true)} will be removed with it. This cannot be undone.`,
      confirmLabel: 'Close basket',
      variant: 'destructive',
    });
    if (confirmed) closeMutation.mutate(id, { onSuccess: () => navigate('..') });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6">
      <PageHeader
        title={cart.partyName ?? 'Walk-in'}
        titleSlot={
          cart.checkoutStartedAt ? (
            <Badge variant="warning">Checking out</Badge>
          ) : (
            <Badge variant="secondary">Open</Badge>
          )
        }
        description={`${pluralize('item', lines.items.length, true)} · ${fmt.currency(lines.subtotal).primary}`}
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab cart={cart} lines={lines} scopeNoun={binding.scopeNoun} />,
          },
          {
            value: 'items',
            label: `Items (${lines.items.length})`,
            permission: permissions.view,
            content: <ItemsTab binding={binding} cartId={id} partyId={cart.partyId} />,
          },
        ]}
      />

      <DangerZone
        title="Close this basket"
        description="The items go with it. Nothing is kept — a basket that has been paid for is recorded as an order, not as a basket."
        buttonText="Close Basket"
        permission={permissions.delete}
        onClick={handleClose}
        disabled={!!cart.checkoutStartedAt || closeMutation.isPending}
        warning="This basket is in the middle of checkout. Let the payment finish first."
        showWarning={!!cart.checkoutStartedAt}
      />
    </div>
  );
};
