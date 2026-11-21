import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuotationSlotProps } from '@/components/suppliers/bindings';

// Removes the quotation from every site it is posted to — deleting its prices there — then deletes it. A site deletes
// its own only while the legal entity has posted it nowhere else.
export const QuotationDeleteZone: React.FC<QuotationSlotProps> = ({ authoring, supplierId, quotation }) => {
  const navigate = useNavigate();
  const deleteMutation = authoring.useDelete(supplierId, {
    onSuccess: () => navigate('../../quotations', { relative: 'path' }),
  });
  const ownSite = authoring.posting.to === 'ownSite';
  const postedElsewhere = ownSite && quotation.sites.some((site) => site.siteId !== quotation.siteId);
  const lockReason = !quotation.canWrite
    ? `Owned by ${quotation.ownerName}, who deletes it`
    : postedElsewhere
      ? 'The legal entity has posted it to other sites; it is removed from them before it can be deleted'
      : undefined;

  return (
    <DangerZone
      title="Delete this quotation"
      description={
        ownSite
          ? 'Removes it from this site — deleting its prices here — and then deletes it.'
          : 'Removes it from every site it is posted to — deleting its prices there — and then deletes it.'
      }
      buttonText="Delete Quotation"
      permission={authoring.permissions.delete}
      confirm={{
        title: `Delete quotation "${quotation.quotationNumber}"?`,
        description:
          quotation.sites.length > 0
            ? `It is removed from ${pluralize('site', quotation.sites.length, true)} first: its prices there are deleted and the prices they replaced apply again.`
            : 'The draft and its lines are deleted.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      }}
      onClick={() => deleteMutation.mutate(quotation.id)}
      isLoading={deleteMutation.isPending}
      disabled={!!lockReason || deleteMutation.isPending}
      warning={lockReason}
      showWarning={!!lockReason}
    />
  );
};
