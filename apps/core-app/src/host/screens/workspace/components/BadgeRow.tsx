import type { ReactNode } from 'react';
import { View } from 'react-native';

// Wrapping chip row under a workspace card title.
export const BadgeRow = ({ children }: { children: ReactNode }) => (
  <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">{children}</View>
);
