import type React from 'react';
import type { OfferingDetail } from '@/schemas/offerings';
import { VariantsTable } from '../../components/offerings/VariantsTable';

interface VariationsTabProps {
  catalogId: string;
  offering: OfferingDetail;
}

export const VariationsTab: React.FC<VariationsTabProps> = ({ catalogId, offering }) => (
  <VariantsTable catalogId={catalogId} offering={offering} />
);
