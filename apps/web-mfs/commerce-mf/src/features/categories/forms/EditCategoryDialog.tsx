import type React from 'react';
import { CategoryForm } from './CategoryForm';
import type { CategoryData } from '@/schemas/categories';

interface EditCategoryDialogProps {
  category: CategoryData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({ category, onSuccess, onCancel }) => {
  return <CategoryForm category={category} businessUnitId={category.businessUnitId} onSuccess={onSuccess} onCancel={onCancel} />;
};
