import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useBlockSiteItem } from '@/hooks/site/inventory-items';
import { type BlockSiteItemFormData, blockSiteItemSchema } from '@/schemas/site-items';

interface BlockSiteItemFormProps {
  inventoryItemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Stops the current site buying the item, with why; stock on hand and goods already ordered still move
export const BlockSiteItemForm: React.FC<BlockSiteItemFormProps> = ({ inventoryItemId, onSuccess, onCancel }) => {
  const form = useForm<BlockSiteItemFormData>({
    resolver: zodResolver(blockSiteItemSchema),
    defaultValues: { reason: '' },
  });

  const blockMutation = useBlockSiteItem({ onSuccess });

  return (
    <Form
      form={form}
      mutation={blockMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ inventoryItemId, data })}
    >
      <TextArea
        name="reason"
        label="Reason"
        placeholder="e.g. Recalled batch, supplier discontinued"
        description="Shown wherever the item is picked for a purchase at this site"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" loadingText="Blocking...">
          Block Purchasing
        </Button>
      </DialogActions>
    </Form>
  );
};
