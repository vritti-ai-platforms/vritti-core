import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type OfferingData,
  type OfferingVariantData,
  type SetTaxClassFormData,
  setTaxClassSchema,
} from '@/schemas/offerings';
import { TaxClassSelector } from '@/selectors/tax-class';
import type { UseBulkSetVariantsTaxClass, UseSetOfferingTaxClass, UseSetVariantTaxClass } from '../types';

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
        {offering.variantsFollowingTaxClassCount > 0 && (
          <Alert
            variant="warning"
            title="This cascades"
            description={`${pluralize('variant', offering.variantsFollowingTaxClassCount, true)} follow this offering and will be updated.${
              offering.variantCount > offering.variantsFollowingTaxClassCount
                ? ` ${pluralize('variant', offering.variantCount - offering.variantsFollowingTaxClassCount, true)} pinned their own and keep it.`
                : ''
            }`}
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
          description="Changing the offering's tax class will no longer update it. Use “Remove Override” to undo."
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

interface BulkSetVariantsTaxClassDialogProps {
  useSet: UseBulkSetVariantsTaxClass;
  offeringId: string;
  variantIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

// The batch form of SetVariantTaxClassDialog — every selected variant is pinned and stops following
export const BulkSetVariantsTaxClassDialog: React.FC<BulkSetVariantsTaxClassDialogProps> = ({
  useSet,
  offeringId,
  variantIds,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SetTaxClassFormData>({ resolver: zodResolver(setTaxClassSchema) });

  const setMutation = useSet({ onSuccess });

  return (
    <Form
      form={form}
      mutation={setMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ offeringId, ids: variantIds, taxClassId: data.taxClassId })}
    >
      <div className="flex flex-col gap-4">
        <Alert
          variant="default"
          title={`${pluralize('variant', variantIds.length, true)} stop following the offering`}
          description="Changing the offering's tax class will no longer update them. Use “Remove Override” on a variant to undo."
        />
        <TaxClassSelector name="taxClassId" />
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Applying...">
          Override Tax Class
        </Button>
      </DialogActions>
    </Form>
  );
};
