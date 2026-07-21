import { Badge } from '@vritti/quantum-ui-native/Badge';
import { Text } from '@vritti/quantum-ui-native/Text';

// Role chip is always primary-tinted, independent of the card's scope accent (matches web).
export const RoleChip = ({ role }: { role: string }) => (
  <Badge variant="outline" className="border-primary/25 bg-primary/10">
    <Text className="font-semibold text-primary">{role}</Text>
  </Badge>
);
