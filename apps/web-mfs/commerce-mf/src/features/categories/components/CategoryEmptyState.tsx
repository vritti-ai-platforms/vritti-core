import { Empty } from '@vritti/quantum-ui/Empty';
import { FolderTree } from 'lucide-react';
import type React from 'react';

export const CategoryEmptyState: React.FC = () => (
  <Empty
    icon={<FolderTree />}
    title="Select a category"
    description="Click a category in the tree to view its details"
    className="flex-1"
  />
);
