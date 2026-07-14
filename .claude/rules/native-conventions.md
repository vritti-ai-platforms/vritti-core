---
description: React Native conventions for core-app + micro-apps using @vritti/quantum-ui-native
paths:
  - "apps/core-app/src/**/*.{ts,tsx}"
  - "apps/micro-apps/**/*.{ts,tsx}"
---

# Native Conventions

## Component imports — subpath only, never barrel

> WHY: Barrel imports pull the entire quantum-ui-native bundle including heavy native components. Subpath imports enable tree-shaking and cut bundle size significantly.

```typescript
// WRONG
import { Button, ScreenContainer } from '@vritti/quantum-ui-native';

// CORRECT
import { Button } from '@vritti/quantum-ui-native/Button';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
```

## Button — never use Pressable/TouchableOpacity directly; ALWAYS pass a `<Text>` child

> WHY: Pressable loses themed colors, haptic feedback, loading spinner state, disabled opacity, and accessibility labels. Every raw Pressable becomes a bug report.
>
> WHY (`<Text>` child): `Button` renders its `children` RAW inside a `View` — it does NOT auto-wrap strings. A bare string label throws **"Text strings must be rendered within a `<Text>` component"** at render. Pass an explicit `<Text>` child; it inherits the button's per-variant text color/size via `TextClassContext`, so no `className` is needed.

```tsx
// WRONG — raw Pressable
<Pressable onPress={onBack}><Text>Back</Text></Pressable>

// WRONG — bare string child → "Text strings must be rendered within a <Text> component"
<Button variant="ghost" onPress={onBack}>Back</Button>

// CORRECT
import { Button } from '@vritti/quantum-ui-native/Button';
import { Text } from '@vritti/quantum-ui-native/Text';
<Button variant="ghost" onPress={onBack}><Text>Back</Text></Button>
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

## Card — never hand-roll a card View

> WHY: A custom `<View className="rounded-xl border p-4">` drifts from the design system (radius, border token, shadow, iOS squircle corner, dark-mode surface). Always use the Card component and adjust it via `className` (it uses tailwind-merge, so `border-primary`/`bg-primary/10` cleanly override the defaults).

```tsx
// WRONG — hand-rolled card
<View className="rounded-xl border border-border p-4">{children}</View>

// CORRECT
import { Card } from '@vritti/quantum-ui-native/Card';
<Card className="gap-2 p-4">{children}</Card>
// highlight: <Card className="border-primary bg-primary/10">…</Card>
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

> WHY: Hardcoded colors break dark mode completely. Semantic tokens auto-switch between light/dark. One hardcoded #ffffff in a card makes the entire screen unusable in dark mode.

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

> WHY: RN Text doesn't apply the app's font family, line-height normalization, or dark mode foreground color. Raw Text renders in system font with black color in dark mode — invisible.

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
  <Button isLoading={isPending} onPress={form.handleSubmit(handleSubmit)}><Text>Submit</Text></Button>
</Form>
```

## Create/edit sheets — `useCreateEditSheet` + `ScreenHeader createLabel`

> WHY: A list/detail screen with a create/edit BottomSheet used to hand-roll `useRef<BottomSheetRef>` + an
> `editing` state + `openCreate`/`openEdit`, plus (for the header `+`) a per-feature React context bridging the
> header button to the screen body. That block was copy-pasted across every feature. `useCreateEditSheet` owns
> the sheet state; `ScreenHeader createLabel` owns the `+` button; a per-route registry bridges them — no context.

Use the hook (from `@vritti/quantum-ui-native/hooks`) for the sheet state, and never re-create a per-feature
`CreateContext`/`CreateProvider`/`CreateButton`.

```tsx
// WRONG — hand-rolled block + per-feature context + inline header CreateButton
const sheetRef = useRef<BottomSheetRef>(null);
const [editing, setEditing] = useState<Thing | null>(null);
const openCreate = () => { setEditing(null); sheetRef.current?.present(); };
const openEdit = (t: Thing) => { setEditing(t); sheetRef.current?.present(); };
const { setCreateHandler } = useThingCreate();
useEffect(() => { setCreateHandler(openCreate); return () => setCreateHandler(null); }, [openCreate, setCreateHandler]);

// CORRECT
import { useCreateEditSheet } from '@vritti/quantum-ui-native/hooks';
const { sheetRef, editing, openCreate, openEdit } = useCreateEditSheet<Thing>({ registerCreateAction: true });
```

- **Header `+` create** (list screens): pass `{ registerCreateAction: true }` and put `createLabel="Add thing"`
  on the `<ScreenHeader>` (like `searchable`). The header renders the `+` and fires the registered `openCreate` —
  do NOT pass a custom `rightActions={<CreateButton/>}` for create, and do NOT build a `<Feature>CreateContext`.

  ```tsx
  // navigator header (index.tsx)
  header: () => <ScreenHeader title="Things" searchable createLabel="Add thing" />
  ```

- **Fab-triggered create** (detail tabs / detail screens): call `useCreateEditSheet<Thing>()` with **no**
  `registerCreateAction`, and wire the Fab yourself: `<Fab onPress={openCreate}>`. (Omitting the flag keeps the
  per-route create-action registry untouched, so several sheets on one route never collide.)

- The FormSheet is a `forwardRef<BottomSheetRef, { editing: T | null }>` that self-seeds on `onPresent`; render it
  `<ThingFormSheet ref={sheetRef} editing={editing} />` and wire cards' edit to `onEdit={openEdit}`.

- **Not** for view-only or fixed-subject sheets. A detail/view sheet (`<QuantDetailSheet quant={…}>`) or an
  edit-only sheet whose subject is fixed (`editing={theCurrentThing}` constant, opened from a header menu) keeps a
  bare `useRef<BottomSheetRef>` + `.present()` — the hook is the create/edit state machine, not a generic ref.

## ScreenContainer — content padding via `contentContainerClassName` (scrollable) / `className` (static)

> WHY: keep padding in Tailwind classes (NativeWind-first), never inline styles or a hand-rolled padded inner
> View. `ScreenContainer` composes your content padding with its own header / floating-tab-bar insets on BOTH
> platforms: iOS carries the inset on the native `contentInset` prop (leaving `contentContainerStyle` free for
> NativeWind); Android has no native `contentInset`, so it applies the inset to the scroll content container and
> routes your `contentContainerClassName` onto an inner content View so the two never collide. Passing an inline
> `contentContainerStyle` re-introduces that collision on Android (the className silently drops).

```tsx
// WRONG — inline contentContainerStyle (bypasses Tailwind; collides with Android insets)
<ScreenContainer scrollable contentContainerStyle={{ gap: 24, padding: 16, paddingBottom: 32 }}>

// WRONG — hand-rolled padded inner View
<ScreenContainer scrollable><View className="gap-6 p-4">{children}</View></ScreenContainer>

// CORRECT — scrollable: pad the content container with Tailwind classes
<ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">{children}</ScreenContainer>

// CORRECT — static (non-scrollable): use className — it's a plain View, so contentContainerClassName is a no-op
<ScreenContainer className="gap-4 p-4">{children}</ScreenContainer>
```

- `contentContainerClassName` applies only to `scrollable` ScreenContainer. On a static one it's a no-op — use `className`.
- `FlashList` is separate — pass padding via its own `contentContainerStyle`/`contentContainerClassName`; this rule is about `ScreenContainer`.
