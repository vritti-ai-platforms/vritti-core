import type React from 'react';
import type { ItemDetail } from '@/schemas/items';
import { OptionsEditor } from './components/OptionsEditor';
import { VariantsEditor } from './components/VariantsEditor';

interface VariationsTabProps {
  item: ItemDetail;
}

export const VariationsTab: React.FC<VariationsTabProps> = ({ item }) => (
  <div className="flex flex-col gap-6">
    <OptionsEditor item={item} />
    <VariantsEditor item={item} />
  </div>
);
