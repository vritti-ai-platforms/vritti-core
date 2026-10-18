import { useSlugParams } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import type { CatalogsBinding } from './bindings';
import { AddListingsProvider } from './forms/add-listings/AddListingsProvider';
import { AddListingsWizard } from './forms/add-listings/AddListingsWizard';

interface AddListingsPageProps {
  binding: CatalogsBinding;
}

// Lists a whole offering's worth of variants in one go. Reads what the wizard needs and hands it to the
// provider — the steps take it from there.
export const AddListingsPage: React.FC<AddListingsPageProps> = ({ binding }) => {
  const { id: catalogId } = useSlugParams('slug');
  const { data: catalog } = binding.useCatalog(catalogId);
  const { data: currencies = [] } = binding.useCurrencies(catalogId);

  return (
    <AddListingsProvider binding={binding} catalogId={catalogId} catalogName={catalog.name} currencies={currencies}>
      <AddListingsWizard />
    </AddListingsProvider>
  );
};
