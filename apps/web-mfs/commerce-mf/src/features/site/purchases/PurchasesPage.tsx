import { PurchasesTable } from '@/components/purchases/PurchasesTable';
import { binding } from './binding';
import { PurchasingRulesBadges } from './components/PurchasingRulesBadges';

export const PurchasesPage = () => (
  <PurchasesTable
    binding={binding}
    title="Purchases"
    description="What the site needs, who supplies it, and how each supplier delivers and invoices"
    titleSlot={<PurchasingRulesBadges />}
  />
);
