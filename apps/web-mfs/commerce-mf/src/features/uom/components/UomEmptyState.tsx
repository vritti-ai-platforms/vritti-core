import { Empty } from '@vritti/quantum-ui/Empty';
import { Ruler } from 'lucide-react';
import type React from 'react';

export const UomEmptyState: React.FC = () => (
  <Empty
    icon={<Ruler />}
    title="Select a unit"
    description="Click a base unit on the left to view its derived units"
    className="flex-1"
  />
);
