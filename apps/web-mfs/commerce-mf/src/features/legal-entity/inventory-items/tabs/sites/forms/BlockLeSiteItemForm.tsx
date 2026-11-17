import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useBlockLeSiteItem } from '@/hooks/legal-entity/inventory-items';
import { type BlockSiteItemFormData, blockSiteItemSchema } from '@/schemas/site-items';

interface BlockLeSiteItemFormProps {
  inventoryItemId: string;
  siteId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Stops one of the legal entity's sites buying the item, with why; stock on hand and goods already ordered still move
export const BlockLeSiteItemForm: React.FC<BlockLeSiteItemFormProps> = ({
  inventoryItemId,
  siteId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<BlockSiteItemFormData>({
    resolver: zodResolver(blockSiteItemSchema),
    defaultValues: { reason: '' },
  });

  const blockMutation = useBlockLeSiteItem(inventoryItemId, { onSuccess });

  return (
    <Form form={form} mutation={blockMutation} onCancel={onCancel} transformSubmit={(data) => ({ siteId, data })}>
      <TextArea
        name="reason"
        label="Reason"
        placeholder="e.g. Recalled batch, supplier discontinued"
        description="Shown wherever the item is picked for a purchase at the site"
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
