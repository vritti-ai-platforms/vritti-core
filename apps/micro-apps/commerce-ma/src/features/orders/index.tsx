import { DatePicker } from '@vritti/quantum-ui-native/DatePicker';
import { type DateRange, DateRangePicker } from '@vritti/quantum-ui-native/DateRangePicker';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { type SelectValue } from '@vritti/quantum-ui-native/Select';
import { BomSelector } from '@vritti/quantum-ui-native/selects/bom';
import { CategorySelector } from '@vritti/quantum-ui-native/selects/category';
import { CostCategorySelector } from '@vritti/quantum-ui-native/selects/cost-category';
import { CurrencySelector } from '@vritti/quantum-ui-native/selects/currency';
import { CustomerSelector } from '@vritti/quantum-ui-native/selects/customer';
import { InventoryItemSelector } from '@vritti/quantum-ui-native/selects/inventory-item';
import { LocaleSelector } from '@vritti/quantum-ui-native/selects/locale';
import { LocationSelector } from '@vritti/quantum-ui-native/selects/location';
import { LotSelector } from '@vritti/quantum-ui-native/selects/lot';
import { PurchaseOrderSelector } from '@vritti/quantum-ui-native/selects/purchase-order';
import { PurchaseOrderItemSelector } from '@vritti/quantum-ui-native/selects/purchase-order-item';
import { QuantSelector } from '@vritti/quantum-ui-native/selects/quant';
import { SerialSelector } from '@vritti/quantum-ui-native/selects/serial';
import { SupplierSelector } from '@vritti/quantum-ui-native/selects/supplier';
import { SupplierItemSelector } from '@vritti/quantum-ui-native/selects/supplier-item';
import { TimezoneSelector } from '@vritti/quantum-ui-native/selects/timezone';
import { UomSelector } from '@vritti/quantum-ui-native/selects/uom';
import { UserSelector } from '@vritti/quantum-ui-native/selects/user';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useState } from 'react';
import { View } from 'react-native';

// Showcase of every @vritti/quantum-ui-native/selects selector, in order. A single shared value map
// keeps each selector controlled without 18 separate useState hooks.
export default function OrdersScreen() {
  const [values, setValues] = useState<Record<string, SelectValue | undefined>>({});
  const [multiTags, setMultiTags] = useState<SelectValue[]>([]);
  const [orderDate, setOrderDate] = useState<string>();
  const [deliveryWindow, setDeliveryWindow] = useState<DateRange | undefined>(undefined);

  const bind = (key: string) => ({
    value: values[key],
    onChange: (v: SelectValue) => setValues((s) => ({ ...s, [key]: v })),
  });

  return (
    <ScreenContainer scrollable>
      <View className="gap-5 p-4">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-foreground">Orders</Text>
          <Text className="text-sm text-muted-foreground">Every quantum-ui-native selector, in order.</Text>
        </View>

        {/* Async commerce selectors — load options from /commerce-api/<entity>/select */}
        <View className="gap-4">
          <Text className="text-base font-semibold text-foreground">Commerce</Text>
          <SupplierSelector {...bind('supplier')} />
          <SupplierItemSelector {...bind('supplierItem')} />
          <CustomerSelector {...bind('customer')} />
          <UomSelector {...bind('uom')} />
          <CategorySelector {...bind('category')} />
          <LocationSelector {...bind('location')} />
          <InventoryItemSelector {...bind('inventoryItem')} />
          <LotSelector {...bind('lot')} />
          <SerialSelector {...bind('serial')} />
          <QuantSelector {...bind('quant')} />
          <BomSelector {...bind('bom')} />
          <PurchaseOrderSelector {...bind('purchaseOrder')} />
          {/* params.purchaseOrderId is required — swap in a real PO id when wiring a flow */}
          <PurchaseOrderItemSelector
            {...bind('purchaseOrderItem')}
            params={{ purchaseOrderId: '00000000-0000-0000-0000-000000000000' }}
          />
          <CostCategorySelector {...bind('costCategory')} />
        </View>

        <View className="gap-4">
          <Text className="text-base font-semibold text-foreground">Dates</Text>
          <DatePicker label="Order date" value={orderDate} onChange={setOrderDate} />
          <DateRangePicker label="Delivery window" value={deliveryWindow} onChange={setDeliveryWindow} />
        </View>

        {/* Identity */}
        <View className="gap-4">
          <Text className="text-base font-semibold text-foreground">People</Text>
          <UserSelector {...bind('user')} />
        </View>

        {/* Static, offline selectors — no backend needed */}
        <View className="gap-4">
          <Text className="text-base font-semibold text-foreground">Static data</Text>
          <CurrencySelector {...bind('currency')} />
          <LocaleSelector {...bind('locale')} />
          <TimezoneSelector {...bind('timezone')} />
        </View>

        {/* Date pickers — native @react-native-community/datetimepicker per platform (iOS compact, Android dialog) */}


        {/* Multi-select — every selector also supports `multiple` */}
        <View className="gap-4">
          <Text className="text-base font-semibold text-foreground">Multi-select</Text>
          <UomSelector multiple value={multiTags} onChange={setMultiTags} />
        </View>
      </View>
    </ScreenContainer>
  );
}
