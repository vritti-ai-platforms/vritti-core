import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCompleteConversion } from '@/hooks/useCompleteConversion';

interface CompleteConversionDialogProps {
  conversionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const completeConversionSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
});

type CompleteConversionFormData = z.infer<typeof completeConversionSchema>;

export const CompleteConversionDialog: React.FC<CompleteConversionDialogProps> = ({ conversionId, onSuccess, onCancel }) => {
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
      showRootError
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: conversionId,
        locationId: data.locationId,
      })}
    >
      <StorageLocationSelector name="locationId" label="Storage Location" placeholder="Select location" />
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
