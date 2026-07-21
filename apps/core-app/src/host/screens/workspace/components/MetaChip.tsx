import { Badge } from '@vritti/quantum-ui-native/Badge';
import { Text } from '@vritti/quantum-ui-native/Text';
import type { ReactNode } from 'react';

// Neutral metadata chip (entity, currency, coverage, …) on workspace cards.
export const MetaChip = ({ children }: { children: ReactNode }) => (
  <Badge variant="outline">
    <Text className="text-muted-foreground">{children}</Text>
  </Badge>
);
