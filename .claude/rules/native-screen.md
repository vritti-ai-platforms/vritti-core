---
description: Screen and route conventions for core-app React Native
paths:
  - "apps/core-app/src/host/screens/**/*.{ts,tsx}"
  - "apps/core-app/src/host/routes/**/*.{ts,tsx}"
---

# Native Screen & Route Files

## Screen structure

Every screen follows this shape:

```tsx
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { usePushNavigator } from '@vritti/quantum-ui-native/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMyAction } from '../../hooks/<domain>';
import { mySchema, type MyFormValues } from '../../schemas/<domain>/<screen>';
import { MyForm } from './form/MyForm';
import type { HostAppRoute } from '../../routes';

export const MyScreen = () => {
  const { push } = usePushNavigator<HostAppRoute>();

  const form = useForm<MyFormValues>({
    resolver: zodResolver(mySchema),
    defaultValues: { field: '' },
  });

  const mutation = useMyAction({
    onSuccess: () => push('NextScreen'),
  });

  return (
    <ScreenContainer>
      <MyForm
        form={form}
        isSubmitting={mutation.isPending}
        onSubmit={(values) => mutation.mutateAsync(values)}
      />
    </ScreenContainer>
  );
};
```

**Rules:**
- Every screen is wrapped in `<ScreenContainer>` — handles safe area, scrolling, and background
- Forms live in a `form/` subdirectory as a separate component; screens don't own form JSX directly
- Screens call hooks, never services directly
- `export const`, never `export function` for components

## Form component structure

```tsx
// screens/<feature>/form/<Feature>Form.tsx
import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import type { UseFormReturn } from 'react-hook-form';
import type { MyFormValues } from '../../../schemas/<domain>/<screen>';

interface MyFormProps {
  form: UseFormReturn<MyFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: MyFormValues) => void;
}

export const MyForm = ({ form, isSubmitting, onSubmit }: MyFormProps) => (
  <Form form={form} onSubmit={onSubmit}>
    <TextField name="field" label="Label" />
    <Button isLoading={isSubmitting} onPress={form.handleSubmit(onSubmit)}>
      Submit
    </Button>
  </Form>
);
```

## Route registration

Routes are **static arrays of PushScreenConfig** — not file-based or react-router.

```typescript
// routes/<feature>/<feature>Routes.ts
import type { PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { MyScreen } from '../../screens/<feature>/MyScreen';

export type MyFeatureRoute = 'MyScreen' | 'OtherScreen';

export const myFeatureRoutes: ReadonlyArray<PushScreenConfig<MyFeatureRoute>> = [
  { name: 'MyScreen', component: MyScreen },
  { name: 'OtherScreen', component: OtherScreen },
];
```

Add new routes to `authenticatedRoutes.ts` and expand the `HostAppRoute` union:

```typescript
// routes/authenticatedRoutes.ts
export type HostAppRoute = HomeRoute | AccountDetailRoute | MyFeatureRoute;

export const authenticatedRoutes: ReadonlyArray<PushScreenConfig<HostAppRoute>> = [
  ...homeRoutes,
  ...accountRoutes,
  ...myFeatureRoutes,
];
```

A screen that isn't in the route array is unreachable — `push('ScreenName')` silently fails.

## File naming

| Type | Pattern | Example |
|------|---------|---------|
| Screen | `<Name>Screen.tsx` | `LoginScreen.tsx` |
| Form component | `form/<Name>Form.tsx` | `form/LoginForm.tsx` |
| Sub-component | `components/<Name>.tsx` | `components/SelectableCard.tsx` |
| Route array | `<feature>Routes.ts` | `authRoutes.ts` |
| Schema | `schemas/<domain>/<screen>.ts` | `schemas/auth/login.ts` |

## Folder layout per domain

```
screens/<feature>/
├── <Feature>Screen.tsx       ← main screen
├── form/
│   └── <Feature>Form.tsx     ← form component
└── components/
    └── <Reusable>.tsx        ← screen-local components
```
