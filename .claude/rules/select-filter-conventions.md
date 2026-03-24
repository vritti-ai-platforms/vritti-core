---
description: Select and Filter component conventions for quantum-ui
paths:
  - "quantum-ui/lib/selects/**"
  - "quantum-ui/lib/components/Select/**"
  - "**/cloud-web/src/**"
  - "**/core-web/src/**"
---

# Select & Filter Conventions

## Select API endpoints

All select endpoints live under `select-api/` prefix — never under `admin-api/` or `cloud-api/`.

```
select-api/industries
select-api/plans
select-api/regions
select-api/cloud-providers
select-api/deployments
select-api/app-versions
select-api/apps
select-api/app-codes
select-api/features
select-api/roles
select-api/microfrontends
select-api/organizations
```

Extra filters are passed as query params via the `params` prop:
```tsx
<AppSelector params={{ versionId }} />
<FeatureSelector params={{ appCode: 'erp' }} />
```

## Pre-configured Selector pattern

Selectors are thin wrappers around `<Select>` with hardcoded `optionsEndpoint` and defaults.

```tsx
export type AppSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

export const AppSelector = forwardRef<HTMLButtonElement, AppSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="App"
    placeholder="Select app"
    searchable
    optionsEndpoint="select-api/apps"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
    {...props}
  />
));
```

Rules:
- **Never destructure props** — pass whole object, defaults first, `{...props}` overrides
- **Never use `as SelectProps` casts** — the spread preserves the union type
- **`optionsEndpoint` is hardcoded** — never overridden by consumers
- **Extra filtering via `params` prop** — never via path params or endpoint override
- Props type: `Omit<SelectProps, 'optionsEndpoint'>` — supports both single and multi-select

## Pre-configured Filter pattern

Filters wrap `<SelectFilter>` with hardcoded endpoint and default `name`.

```tsx
export type PlanFilterProps = Omit<SelectFilterProps, 'optionsEndpoint' | 'name'> & { name?: string };

export const PlanFilter = Object.assign(
  forwardRef<HTMLButtonElement, PlanFilterProps>((props, ref) => (
    <SelectFilter
      ref={ref}
      name="planId"
      label="Plan"
      placeholder="Select plan"
      optionsEndpoint="select-api/plans"
      fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
      {...props}
    />
  )),
  { displayName: 'PlanFilter', defaultLabel: 'Plan' },
);
```

Rules:
- **Same no-destructure pattern as selectors**
- **`name` serves as both form field key and FilterResult field identifier** — no separate `field` prop
- **`name` is optional** with a sensible default (e.g., `'planId'`), placed before `{...props}` so user can override
- **`optionsEndpoint` is hardcoded** — omitted from props type
- Props type: `Omit<SelectFilterProps, 'optionsEndpoint' | 'name'> & { name?: string }`

## SelectProps / SelectFilterProps — NOT discriminated unions

Both are single interfaces with `multiple?: boolean`, not discriminated unions. The runtime `if (multiple)` branching happens inside `Select`/`SelectFilter`.

```typescript
// CORRECT — single interface
export interface SelectFilterProps extends ... {
  multiple?: boolean;
  value?: FilterResult | SelectValue | SelectValue[];
  onChange?: (result: FilterResult | null | undefined) => void;
}

// WRONG — discriminated union causes spread type errors
type SelectFilterProps = SelectFilterSingleProps | SelectFilterMultiProps;
```

## Usage in forms

```tsx
// Single select (default)
<AppSelector name="appId" />

// Multi-select
<AppSelector name="appIds" multiple />

// With extra filter params
<FeatureSelector name="featureId" params={{ appCode }} />

// Filter in data table
<PlanFilter key="planId" name="planId" />
```
