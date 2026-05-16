import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { z, zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useSendPurchaseOrderEmail } from '@/hooks/purchase-orders';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';

interface SendPurchaseOrderEmailDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

const sendPurchaseOrderEmailSchema = z.object({
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
});

type SendPurchaseOrderEmailFormData = z.infer<typeof sendPurchaseOrderEmailSchema>;

export const SendPurchaseOrderEmailDialog: React.FC<SendPurchaseOrderEmailDialogProps> = ({
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SendPurchaseOrderEmailFormData>({
    resolver: zodResolver(sendPurchaseOrderEmailSchema),
    defaultValues: {
      email: '',
    },
  });

  const sendEmailMutation = useSendPurchaseOrderEmail({ onSuccess });

  return (
    <Form
      form={form}
      mutation={sendEmailMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrder.id,
        email: data.email?.trim() || undefined,
      })}
    >
      <TextField
        name="email"
        label="Recipient Email (Optional)"
        type="email"
        placeholder="Uses supplier email if left empty"
      />
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Sending...">
          Send Email
        </Button>
      </div>
    </Form>
  );
};
