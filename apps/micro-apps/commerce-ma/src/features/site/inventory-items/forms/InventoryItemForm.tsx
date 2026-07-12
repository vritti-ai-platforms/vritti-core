import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { RadioGroup, type RadioOption } from '@vritti/quantum-ui-native/RadioGroup';
import type { SelectOption } from '@vritti/quantum-ui-native/Select';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { Text } from '@vritti/quantum-ui-native/Text';
import { CategorySelector } from '@vritti/quantum-ui-native/selects/category';
import { TaxGroupSelector } from '@vritti/quantum-ui-native/selects/tax-group';
import { UomSelector } from '@vritti/quantum-ui-native/selects/uom';
import type { UseFormReturn } from 'react-hook-form';
import { PICK_STRATEGY_OPTIONS, TRACKING_OPTIONS, TYPE_OPTIONS } from '../../../../services/site/inventory-items';
import type {
  CreateInventoryItemFormValues,
  UpdateInventoryItemFormValues,
} from '../../../../schemas/inventory-items/inventory-item';

// The shared option arrays are SelectOption[] (value: string | number | boolean); RadioGroup wants
// RadioOption[] (value: string). These enum lists are all string-valued, so narrow them here.
function toRadioOptions(options: SelectOption[]): RadioOption[] {
  return options.map((option) => ({
    value: String(option.value),
    label: option.label,
    description: option.description,
    disabled: option.disabled,
  }));
}

const TYPE_RADIO = toRadioOptions(TYPE_OPTIONS);
const TRACKING_RADIO = toRadioOptions(TRACKING_OPTIONS);
const PICK_STRATEGY_RADIO = toRadioOptions(PICK_STRATEGY_OPTIONS);

// Create form carries `tracking` (immutable after create); edit form does not. Type on the create
// superset so every field name is known; in edit mode the tracking field is simply not rendered.
type FormValues = CreateInventoryItemFormValues | UpdateInventoryItemFormValues;

interface InventoryItemFormProps {
  form: UseFormReturn<CreateInventoryItemFormValues> | UseFormReturn<UpdateInventoryItemFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: FormValues) => void;
  mode: 'create' | 'edit';
}

// All fields auto-wire to react-hook-form via the `name` prop — quantum <Form> reads each field's
// `fieldBinding` (TextField → value/onChangeText, RadioGroup → value/onValueChange, Select → value/onChange).
// No <Controller>. FK fields are Apollo-backed Select pickers (Category/UOM/TaxGroup). hasMrp/MRP is deferred
// (TODO(mrp)); it'd fail server validation without mrpUomId.
export const InventoryItemForm = ({ form, isSubmitting, onSubmit, mode }: InventoryItemFormProps) => {
  const sharedForm = form as UseFormReturn<CreateInventoryItemFormValues>;
  const submit = sharedForm.handleSubmit(onSubmit as (values: CreateInventoryItemFormValues) => void);

  return (
    <Form form={sharedForm}>
      <TextField name="name" label="Name" placeholder="e.g. Steel bolt M6" autoCapitalize="words" />
      <TextField
        name="code"
        label="Code"
        placeholder="e.g. BOLT-M6"
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <RadioGroup name="type" label="Type" options={TYPE_RADIO} />
      {mode === 'create' ? <RadioGroup name="tracking" label="Tracking" options={TRACKING_RADIO} /> : null}
      <RadioGroup name="pickStrategy" label="Pick strategy" options={PICK_STRATEGY_RADIO} />

      {/* FK pickers — Apollo-backed Select dropdowns (search + infinite scroll), wired by `name` like any field. */}
      <CategorySelector name="categoryId" />
      <UomSelector name="uomId" />
      <TaxGroupSelector name="purchaseTaxGroupId" />

      <TextField name="hsnCode" label="HSN code" placeholder="Optional" autoCapitalize="characters" />
      <TextField name="description" label="Description" placeholder="Optional" multiline numberOfLines={3} />

      <Button isLoading={isSubmitting} onPress={submit}>
        <Text>{mode === 'create' ? 'Create item' : 'Save changes'}</Text>
      </Button>
    </Form>
  );
};
