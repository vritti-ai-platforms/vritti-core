import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { z, zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCompleteConversion } from '@/hooks/conversions';

interface CompleteConversionDialogProps {
  conversionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const completeConversionSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
});

type CompleteConversionFormData = z.infer<typeof completeConversionSchema>;

export const CompleteConversionDialog: React.FC<CompleteConversionDialogProps> = ({
  conversionId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CompleteConversionFormData>({
    resolver: zodResolver(completeConversionSchema),
    defaultValues: {
      locationId: undefined,
    },
  });

  const completeMutation = useCompleteConversion({ onSuccess });

  return (
    <Form
      form={form}
      mutation={completeMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: conversionId,
        locationId: data.locationId,
      })}
    >
      <LocationSelector name="locationId" label="Location" placeholder="Select location" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Completing...">
          Complete
        </Button>
      </div>
    </Form>
  );
};
