import { PressableCard } from '@vritti/quantum-ui-native/Card';
import { Text } from '@vritti/quantum-ui-native/Typography';
import * as React from 'react';
import { View } from 'react-native';

interface SelectableCardProps {
  selected: boolean;
  onPress: () => void;
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const SelectableCard = ({
  selected,
  onPress,
  leading,
  title,
  subtitle,
  trailing,
}: SelectableCardProps) => {
  return (
    <PressableCard
      onPress={onPress}
      selected={selected}
      className={`rounded-2xl p-4 flex-row items-center gap-3 ${selected ? '' : 'border border-border bg-card'}`}
    >
      {leading ? leading : null}

      <View className="flex-1 gap-0.5">
        {typeof title === 'string' ? <Text className="text-[15px] font-semibold text-foreground">{title}</Text> : title}
        {typeof subtitle === 'string' ? (
          <Text className="text-[13px] text-muted-foreground">{subtitle}</Text>
        ) : (
          subtitle
        )}
      </View>

      {trailing ? trailing : null}
    </PressableCard>
  );
};
