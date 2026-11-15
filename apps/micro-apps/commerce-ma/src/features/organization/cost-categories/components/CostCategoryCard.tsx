import { Badge } from '@vritti/quantum-ui-native/Badge';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Card } from '@vritti/quantum-ui-native/Card';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useUnstableNativeVariable } from 'nativewind';
import { View } from 'react-native';
import type { CostCategory } from '../../../../types/cost-categories';
import { CostCategoryActionsMenu } from './CostCategoryActionsMenu';

const EDIT_ICON = { sfSymbol: 'pencil', materialSymbol: 'edit' } as const;

// tsc resolves nativewind's web type for this hook (() => never); at RN runtime it's the native
// (name) => string variant. Cast to the native signature (mirrors UomUnitCard) — the MF-shared, app-theme
// -accurate source.
const useThemeVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

interface CostCategoryCardProps {
  category: CostCategory;
  onEdit: (category: CostCategory) => void;
  onToggleActive: (category: CostCategory) => void;
  onDelete: (category: CostCategory) => void;
}

// Cost category card: a code tile + name + a kind badge and Active/Inactive status badge (+ optional System
// badge), with a pencil edit button and an overflow menu (activate/deactivate + delete). Rename-only edit;
// code/kind are immutable.
export function CostCategoryCard({ category, onEdit, onToggleActive, onDelete }: CostCategoryCardProps) {
  // Active = success (green), Inactive = muted (gray). Tint from the resolved theme var (Badge faded fills
  // don't render on these hsl(var()) tokens): faded fill + solid dot/text.
  const statusVar = useThemeVar(category.isActive ? '--success' : '--muted-foreground');
  const statusHsl = statusVar ? statusVar.split(' ').join(', ') : undefined;
  const statusColor = statusHsl ? `hsl(${statusHsl})` : undefined;
  const statusBg = statusHsl ? `hsla(${statusHsl}, 0.18)` : undefined;

  return (
    <Card className="p-0">
      <View className="flex-row items-center gap-3 px-4 py-3">
        <View className="h-14 w-14 items-center justify-center rounded-xl bg-secondary">
          <Text className="text-base font-bold text-primary" numberOfLines={1}>
            {category.code}
          </Text>
        </View>
        <View className="min-w-0 flex-1 gap-1.5">
          <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
            {category.name}
          </Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{category.kind}</Text>
            </Badge>
            <Badge variant="secondary" style={statusBg ? { backgroundColor: statusBg } : undefined}>
              <View className="flex-row items-center gap-1.5">
                <View
                  className="h-1.5 w-1.5 rounded-full"
                  style={statusColor ? { backgroundColor: statusColor } : undefined}
                />
                <Text className="text-xs font-medium" style={statusColor ? { color: statusColor } : undefined}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </Badge>
            {category.isSystem ? (
              <Badge variant="secondary">
                <Text className="text-xs font-medium text-muted-foreground">System</Text>
              </Badge>
            ) : null}
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-sm border border-border"
            onPress={() => onEdit(category)}
            accessibilityLabel="Edit cost category"
            hitSlop={8}
          >
            <DynamicIcon icon={EDIT_ICON} size={14} className="text-foreground" />
          </Button>
          <CostCategoryActionsMenu category={category} onToggleActive={onToggleActive} onDelete={onDelete} />
        </View>
      </View>
    </Card>
  );
}
