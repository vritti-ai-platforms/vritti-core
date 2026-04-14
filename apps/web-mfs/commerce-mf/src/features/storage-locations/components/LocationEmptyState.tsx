import { Empty } from '@vritti/quantum-ui/Empty';
import { MapPin } from 'lucide-react';
import type React from 'react';

export const LocationEmptyState: React.FC = () => (
  <Empty
    icon={<MapPin />}
    title="Select a location"
    description="Pick a location from the tree to view details and child locations."
    className="h-full"
  />
);
