import { Typography } from '@vritti/quantum-ui/Typography';
import { LayoutGrid } from 'lucide-react';
import type React from 'react';

export const CategoryEmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
    <LayoutGrid className="h-12 w-12 opacity-30" />
    <Typography variant="body2" className="font-medium">Select a category</Typography>
    <Typography variant="caption" intent="muted">Click a category in the tree to view its details</Typography>
  </div>
);
