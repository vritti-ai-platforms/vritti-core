import type React from 'react';
import type { CategoryData } from '@/schemas/categories';
import { CategoryForm } from './CategoryForm';

interface EditCategoryDialogProps {
  category: CategoryData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({ category, onSuccess, onCancel }) => {
  return (
    <CategoryForm
      category={category}
      businessUnitId={category.businessUnitId}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};
