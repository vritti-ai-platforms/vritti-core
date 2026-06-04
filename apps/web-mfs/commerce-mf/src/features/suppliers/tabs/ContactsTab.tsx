import { PageContent, PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { useState } from 'react';
import { SupplierContactsContent } from '../components/SupplierContactsContent';
import { SupplierContactsSidePanel } from '../components/SupplierContactsSidePanel';

interface ContactsTabProps {
  supplierId: string;
}

export const ContactsTab = ({ supplierId }: ContactsTabProps) => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  return (
    <PageContent>
      <SupplierContactsSidePanel
        supplierId={supplierId}
        selectedContactId={selectedContactId}
        onSelectContact={setSelectedContactId}
      />
      <PageContentDetails>
        <SupplierContactsContent
          supplierId={supplierId}
          selectedContactId={selectedContactId}
          onSelectContact={setSelectedContactId}
        />
      </PageContentDetails>
    </PageContent>
  );
};
