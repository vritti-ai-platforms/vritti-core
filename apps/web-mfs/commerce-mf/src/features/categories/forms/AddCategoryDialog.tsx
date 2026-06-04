import { useSlugParams } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import { CategoryForm } from './CategoryForm';

interface AddCategoryDialogProps {
  defaultParentId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({
  defaultParentId = null,
  onSuccess,
  onCancel,
}) => {
  const { id: buId } = useSlugParams('buSlug');

  return (
    <CategoryForm
      businessUnitId={buId}
      defaultParentId={defaultParentId}
      disableParentSelector={!!defaultParentId}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};
