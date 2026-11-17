import { PurchasesTable } from '@/components/purchases/PurchasesTable';
import { binding } from './binding';
import { PurchasingRulesButton } from './components/PurchasingRulesDialog';

export const PurchasesPage = () => (
  <PurchasesTable
    binding={binding}
    title="Purchases"
    description="What your sites need, who supplies it, and how each supplier delivers and invoices"
    extraActions={<PurchasingRulesButton />}
  />
);
