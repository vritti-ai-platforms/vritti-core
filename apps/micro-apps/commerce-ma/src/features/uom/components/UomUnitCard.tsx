import { Badge } from '@vritti/quantum-ui-native/Badge';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Card } from '@vritti/quantum-ui-native/Card';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useUnstableNativeVariable } from 'nativewind';
import { View } from 'react-native';
import type { Uom } from '../../../types/uom';

const EDIT_ICON = { sfSymbol: 'pencil', materialSymbol: 'edit' } as const;
const TRASH_ICON = { sfSymbol: 'trash', materialSymbol: 'delete' } as const;
const CONVERT_ICON = {
  sfSymbol: 'arrow.left.arrow.right',
  materialSymbol: 'swap_horiz',
} as const;
const ANCHOR_ICON = { sfSymbol: 'cube', materialSymbol: 'cube' } as const;

const formatQty = (n: number): string => n.toLocaleString('en-US');

// tsc resolves nativewind's web type for this hook (() => never); at RN runtime it's the native
// (name) => string variant. Cast to the native signature (mirrors quantum's PushNavigator). The var is
// the MF-shared, app-theme-accurate source — useColorScheme/Appearance would give the system scheme.
const useThemeVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

interface UomUnitCardProps {
  unit: Uom;
  onEdit?: (unit: Uom) => void;
  onDelete?: (unit: Uom) => void;
}

// Unit card: a symbol tile + name + Base/Derived badge with edit/delete actions, then a conversion row —
// the derived formula (uomQty symbol = baseUomQty baseSymbol) or a "no conversion" note for base units.
// Edit/delete are gated on canEdit/canDelete (the list computes both).
export function UomUnitCard({ unit, onEdit, onDelete }: UomUnitCardProps) {
  const isBase = unit.baseUnitId == null;
  // Base = success (green), Derived = info (teal). The Badge variants' faded fills (bg-<token>/NN) don't
  // render on these hsl(var()) tokens, so tint both from the resolved theme var: a faded fill + a solid
  // dot/text. useThemeVar is the MF-shared, app-theme-accurate source (useColorScheme gives the system one).
  const kindVar = useThemeVar(isBase ? '--success' : '--info');
  const kindHsl = kindVar ? kindVar.split(' ').join(', ') : undefined;
  const kindColor = kindHsl ? `hsl(${kindHsl})` : undefined;
  const kindBg = kindHsl ? `hsla(${kindHsl}, 0.18)` : undefined;
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="flex-row items-center gap-3 px-4 pb-0 pt-4">
        <View className="h-14 w-14 items-center justify-center rounded-xl bg-secondary">
          <Text className="text-xl font-bold text-primary" numberOfLines={1}>
            {unit.symbol}
          </Text>
        </View>
        <Text className="min-w-0 flex-1 text-lg font-bold text-foreground" numberOfLines={1}>
          {unit.name}
        </Text>
        <View className="flex-row items-center gap-2">
          {onEdit && unit.canEdit ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-sm border border-border"
              onPress={() => onEdit(unit)}
              accessibilityLabel="Edit unit"
              hitSlop={8}
            >
              <DynamicIcon icon={EDIT_ICON} size={14} className="text-foreground" />
            </Button>
          ) : null}
          {onDelete && unit.canDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-sm border border-destructive"
              onPress={() => onDelete(unit)}
              accessibilityLabel="Delete unit"
              hitSlop={8}
            >
              <DynamicIcon icon={TRASH_ICON} size={14} className="text-destructive" />
            </Button>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center gap-2 px-4 pb-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-2 rounded-lg bg-muted px-3 py-3">
          <DynamicIcon icon={isBase ? ANCHOR_ICON : CONVERT_ICON} size={16} className="text-muted-foreground" />
          {isBase ? (
            <Text className="flex-1 text-sm text-muted-foreground" numberOfLines={1}>
              Base unit — no conversion
            </Text>
          ) : (
            <Text className="flex-1 font-mono text-sm text-foreground" numberOfLines={1}>
              {formatQty(unit.uomQty)} {unit.symbol} = {formatQty(unit.baseUomQty)} {unit.baseUnitSymbol ?? '—'}
            </Text>
          )}
        </View>
        <Badge variant="secondary" style={kindBg ? { backgroundColor: kindBg } : undefined}>
          <View className="flex-row items-center gap-1.5">
            <View className="h-1.5 w-1.5 rounded-full" style={kindColor ? { backgroundColor: kindColor } : undefined} />
            <Text className="text-xs font-medium" style={kindColor ? { color: kindColor } : undefined}>
              {isBase ? 'Base' : 'Derived'}
            </Text>
          </View>
        </Badge>
      </View>
    </Card>
  );
}
