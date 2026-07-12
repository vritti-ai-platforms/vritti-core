import { Badge } from '@vritti/quantum-ui-native/Badge';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Card } from '@vritti/quantum-ui-native/Card';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useUnstableNativeVariable } from 'nativewind';
import { View } from 'react-native';
import type { TaxGroup } from '../../../../types/tax-groups';

const PERCENT_ICON = { sfSymbol: 'percent', materialSymbol: 'percent' } as const;
const EDIT_ICON = { sfSymbol: 'pencil', materialSymbol: 'edit' } as const;
const TRASH_ICON = { sfSymbol: 'trash', materialSymbol: 'delete' } as const;

// tsc resolves nativewind's web type for this hook (() => never); at RN runtime it's the native
// (name) => string variant. Cast to the native signature (mirrors UomUnitCard) — the MF-shared, app-theme
// -accurate source (useColorScheme/Appearance would give the system scheme).
const useThemeVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

const formatRate = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(2));

interface TaxGroupCardProps {
  group: TaxGroup;
  onEdit: (group: TaxGroup) => void;
  onDelete: (group: TaxGroup) => void;
}

// Tax group card: a % tile + name + Active/Inactive status badge with edit/delete actions, then the tax
// rate chips and a computed TOTAL (sum of rates — the server has no total). Delete is hidden when the group
// is referenced by an item/offering (canDelete=false).
export function TaxGroupCard({ group, onEdit, onDelete }: TaxGroupCardProps) {
  const total = group.taxRates.reduce((sum, r) => sum + r.rate, 0);

  // Active = success (green), Inactive = muted (gray). Tint from the resolved theme var (the Badge variants'
  // faded fills don't render on these hsl(var()) tokens): a faded fill + a solid dot/text.
  const statusVar = useThemeVar(group.isActive ? '--success' : '--muted-foreground');
  const statusHsl = statusVar ? statusVar.split(' ').join(', ') : undefined;
  const statusColor = statusHsl ? `hsl(${statusHsl})` : undefined;
  const statusBg = statusHsl ? `hsla(${statusHsl}, 0.18)` : undefined;

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-4">
        <View className="h-14 w-14 items-center justify-center rounded-xl bg-secondary">
          <DynamicIcon icon={PERCENT_ICON} size={22} className="text-primary" />
        </View>
        <View className="min-w-0 flex-1 gap-1.5">
          <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
            {group.name}
          </Text>
          <View className="flex-row">
            <Badge variant="secondary" style={statusBg ? { backgroundColor: statusBg } : undefined}>
              <View className="flex-row items-center gap-1.5">
                <View
                  className="h-1.5 w-1.5 rounded-full"
                  style={statusColor ? { backgroundColor: statusColor } : undefined}
                />
                <Text className="text-xs font-medium" style={statusColor ? { color: statusColor } : undefined}>
                  {group.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </Badge>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-sm border border-border"
            onPress={() => onEdit(group)}
            accessibilityLabel="Edit tax group"
            hitSlop={8}
          >
            <DynamicIcon icon={EDIT_ICON} size={14} className="text-foreground" />
          </Button>
          {group.canDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-sm border border-destructive"
              onPress={() => onDelete(group)}
              accessibilityLabel="Delete tax group"
              hitSlop={8}
            >
              <DynamicIcon icon={TRASH_ICON} size={14} className="text-destructive" />
            </Button>
          ) : null}
        </View>
      </View>

      <View className="mx-4 h-px bg-border" />

      <View className="gap-2 px-4 pb-3 pt-3">
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax Rates</Text>
        {group.taxRates.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {group.taxRates.map((rate) => (
              <Badge key={rate.id} variant="secondary">
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs text-muted-foreground">{rate.name}</Text>
                  <Text className="text-xs font-bold text-foreground">{formatRate(rate.rate)}%</Text>
                </View>
              </Badge>
            ))}
          </View>
        ) : (
          <Text className="text-sm text-muted-foreground">No rates</Text>
        )}
      </View>

      <View className="flex-row items-center justify-between px-4 pb-4">
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</Text>
        <Text className="font-mono text-lg font-bold text-foreground">{total.toFixed(2)}%</Text>
      </View>
    </Card>
  );
}
