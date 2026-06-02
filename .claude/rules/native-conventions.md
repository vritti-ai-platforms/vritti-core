---
description: React Native conventions for core-app using @vritti/quantum-ui-native
paths:
  - "apps/core-app/src/**/*.{ts,tsx}"
---

# Native Conventions

## Component imports — subpath only, never barrel

```typescript
// WRONG
import { Button, ScreenContainer } from '@vritti/quantum-ui-native';

// CORRECT
import { Button } from '@vritti/quantum-ui-native/Button';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
```

## Button — never use Pressable/TouchableOpacity directly for actions

```tsx
// WRONG
<Pressable onPress={onBack}><Text>Back</Text></Pressable>

// CORRECT
import { Button } from '@vritti/quantum-ui-native/Button';
<Button variant="ghost" onPress={onBack}>Back</Button>
```

## Spinner — never use ActivityIndicator

```tsx
// WRONG
<ActivityIndicator size="large" color="#0000ff" />

// CORRECT
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
<Spinner size="large" />
```

## List — never use FlatList

```tsx
// WRONG
<FlatList data={items} renderItem={...} />

// CORRECT
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
<FlashList data={items} renderItem={...} estimatedItemSize={60} />
```

## Alerts — never use Alert.alert()

```tsx
// WRONG
Alert.alert('Error', 'Something went wrong');

// CORRECT
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
<StaticAlert variant="destructive" title="Error" description="Something went wrong" />

// OR for imperative dialogs
import { useDialog } from '@vritti/quantum-ui-native/hooks';
const dialog = useDialog();
dialog.alert({ title: 'Error', description: 'Something went wrong' });
```

## Destructive actions — use useConfirm

```tsx
// WRONG
onPress: () => deleteMutation.mutate(id)

// CORRECT
import { useConfirm } from '@vritti/quantum-ui-native/hooks';
const confirm = useConfirm();

async function handleDelete(id: string, name: string) {
  const confirmed = await confirm({
    title: `Delete ${name}?`,
    description: `${name} will be permanently removed. This cannot be undone.`,
    confirmLabel: 'Delete',
    variant: 'destructive',
  });
  if (confirmed) deleteMutation.mutate(id);
}
```

## Colors — NEVER hardcode

Use Tailwind semantic tokens via `className` or `getTheme()` for inline styles.

```tsx
// WRONG
<View style={{ backgroundColor: '#ffffff' }}>
<Text style={{ color: 'gray' }}>
<View className="bg-gray-100">

// CORRECT — Tailwind className
<View className="bg-card rounded-xl p-4">
<Text className="text-muted-foreground text-sm">

// CORRECT — inline style when dynamic
import { getTheme } from '@vritti/quantum-ui-native/colors';
const colors = getTheme();  // no param — reads Appearance internally
<View style={{ borderColor: colors.border }} />
```

Available tokens: `primary`, `secondary`, `muted`, `accent`, `destructive`, `warning`, `success`, `foreground`, `background`, `card`, `border`. Opacity: `bg-destructive/15`.

The only allowed hardcoded color is `'transparent'`.

## getTheme() — no parameter, never in useMemo with isDark dep

```typescript
// WRONG — param no longer accepted
const colors = getTheme(isDark ? 'dark' : 'light');

// WRONG — isDark is not what getTheme reads internally
const colors = useMemo(() => getTheme(), [isDark]);

// CORRECT — plain call during render
const colors = getTheme();

// CORRECT — memoized options that update on scheme change
const colorScheme = useColorScheme();
const options = useMemo(() => {
  const colors = getTheme();
  return { headerStyle: { backgroundColor: colors.background } };
}, [colorScheme]);
```

## Navigation — usePushNavigator with route type

```typescript
// WRONG — untyped, no autocomplete
const { push } = usePushNavigator();

// CORRECT — typed to the current navigator's routes
import type { HostAppRoute } from '../../routes';
const { push } = usePushNavigator<HostAppRoute>();
push('AccountScreen');
```

## Text — always use the Text component, never raw RN Text for content

```tsx
// WRONG — raw React Native Text
import { Text } from 'react-native';
<Text>Hello</Text>

// CORRECT — quantum-ui-native Text
import { Text } from '@vritti/quantum-ui-native/Text';
<Text className="text-foreground text-base">Hello</Text>
```

## Forms — react-hook-form + zod + Form component

```tsx
import { Form } from '@vritti/quantum-ui-native/Form';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<MyValues>({ resolver: zodResolver(mySchema) });

<Form form={form} onSubmit={handleSubmit}>
  <TextField name="email" label="Email" keyboardType="email-address" autoCapitalize="none" />
  <Button isLoading={isPending} onPress={form.handleSubmit(handleSubmit)}>Submit</Button>
</Form>
```
