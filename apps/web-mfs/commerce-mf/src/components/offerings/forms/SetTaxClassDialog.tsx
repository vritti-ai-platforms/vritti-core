import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { TaxClassSelector } from '@vritti/quantum-ui/selects/tax-class';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type OfferingData,
  type OfferingVariantData,
  type SetTaxClassFormData,
  setTaxClassSchema,
} from '@/schemas/offerings';
import type { UseSetOfferingTaxClass, UseSetVariantTaxClass } from '../types';

interface SetTaxClassDialogProps {
  useSet: UseSetOfferingTaxClass;
  offering: OfferingData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Its own dialog rather than a field on the edit form: applying it rewrites every variant that has
// not pinned its own, which is not something a general edit should do without saying so.
export const SetTaxClassDialog: React.FC<SetTaxClassDialogProps> = ({ useSet, offering, onSuccess, onCancel }) => {
  const form = useForm<SetTaxClassFormData>({
    resolver: zodResolver(setTaxClassSchema),
    defaultValues: { taxClassId: offering.taxClassId },
  });

  const setMutation = useSet({ onSuccess });

  return (
    <Form
      form={form}
      mutation={setMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: offering.id, taxClassId: data.taxClassId })}
    >
      <div className="flex flex-col gap-4">
        {offering.variantCount > 0 && (
          <Alert
            variant="warning"
            title="This cascades"
            description={`${pluralize('variant', offering.variantCount, true)} follow this offering. Any that pin their own tax class keep it — the rest are updated.`}
          />
        )}

        <TaxClassSelector name="taxClassId" />
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Applying...">
          Apply Tax Class
        </Button>
      </DialogActions>
    </Form>
  );
};

interface SetVariantTaxClassDialogProps {
  useSet: UseSetVariantTaxClass;
  variant: OfferingVariantData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Pinning a variant's own class exempts it from the offering's cascade from here on
export const SetVariantTaxClassDialog: React.FC<SetVariantTaxClassDialogProps> = ({
  useSet,
  variant,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SetTaxClassFormData>({
    resolver: zodResolver(setTaxClassSchema),
    defaultValues: { taxClassId: variant.taxClassId },
  });

  const setMutation = useSet({ onSuccess });

  return (
    <Form
      form={form}
      mutation={setMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ variantId: variant.id, taxClassId: data.taxClassId })}
    >
      <div className="flex flex-col gap-4">
        <Alert
          variant="default"
          title="This variant stops following the offering"
          description="Changing the offering's tax class will no longer update it. Use “Follow offering” to undo."
        />
        <TaxClassSelector name="taxClassId" />
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Pinning...">
          Override
        </Button>
      </DialogActions>
    </Form>
  );
};
