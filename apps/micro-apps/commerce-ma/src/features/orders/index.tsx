import { DatePicker } from '@vritti/quantum-ui-native/DatePicker';
import { type DateRange, DateRangePicker } from '@vritti/quantum-ui-native/DateRangePicker';
import { DateTimePicker } from '@vritti/quantum-ui-native/DateTimePicker';
import { type DateTimeRange, DateTimeRangePicker } from '@vritti/quantum-ui-native/DateTimeRangePicker';
import { FormattedDate } from '@vritti/quantum-ui-native/FormattedDate';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useState } from 'react';
import { View } from 'react-native';

export default function OrdersScreen() {
  const [orderDate, setOrderDate] = useState<string>();
  const [deliveryWindow, setDeliveryWindow] = useState<DateRange | undefined>(undefined);
  const [orderPlacedAt, setOrderPlacedAt] = useState<string>();
  const [deliverySlot, setDeliverySlot] = useState<DateTimeRange | undefined>(undefined);

  return (
    <ScreenContainer scrollable>
      <View className="gap-5 p-4">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-foreground">Orders</Text>
          <Text className="text-sm text-muted-foreground">Select the order and delivery dates.</Text>
        </View>

        <View className="gap-4">
          <DatePicker
            label="Order date"
            clearable
            value={orderDate}
            onChange={(date) => {
              console.log('[orders] order date change', date);
              setOrderDate(date);
            }}
          />
          <DateRangePicker
            label="Delivery window"
            clearable
            value={deliveryWindow}
            onChange={(range) => {
              console.log('[orders] delivery window change', range);
              setDeliveryWindow(range);
            }}
          />

          <DateTimePicker
            label="Order placed at"
            clearable
            value={orderPlacedAt}
            onChange={(value) => {
              console.log('[orders] order placed at change', value);
              setOrderPlacedAt(value);
            }}
          />
          {orderPlacedAt ? (
            <View className="gap-1">
              <Text className="text-xs text-muted-foreground">Stored UTC: {orderPlacedAt}</Text>
              <Text className="text-sm text-foreground">
                Rendered in BU zone: <FormattedDate value={orderPlacedAt} />
              </Text>
            </View>
          ) : null}

          <DateTimeRangePicker
            label="Delivery slot (with time)"
            clearable
            value={deliverySlot}
            onChange={(range) => {
              console.log('[orders] delivery slot change', range);
              setDeliverySlot(range);
            }}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
