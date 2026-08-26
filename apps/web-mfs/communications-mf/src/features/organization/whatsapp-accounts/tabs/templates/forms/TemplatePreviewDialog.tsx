import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { Select, type SelectOption } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { Send } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useSendWhatsappTemplateTest, useWhatsappPhoneNumbers } from '@/hooks/organization/whatsapp-accounts';
import {
  type SendTemplateTestFormData,
  sendTemplateTestSchema,
  type WhatsappTemplateData,
} from '@/schemas/whatsapp-templates';
import { TemplatePreview } from '../components/TemplatePreview';
import { countTemplateVariables, substituteVariables } from '../utils/template-components';

interface TemplatePreviewDialogProps {
  accountId: string;
  template: WhatsappTemplateData;
  onClose: () => void;
}

// Preview bubble plus a send-a-test form. The form only shows for APPROVED templates (Meta refuses
// anything else) and templates.send holders — a send is a real, billable message. Typing variable
// values substitutes them into the preview live. The dialog stays open after a send (the success
// toast confirms it) so more test numbers can follow.
export const TemplatePreviewDialog = ({ accountId, template, onClose }: TemplatePreviewDialogProps) => {
  const { available: canSend } = usePermission(ORG_WHATSAPP_ACCOUNTS.templates.send);
  const isApproved = template.status === 'APPROVED';
  const showSend = isApproved && canSend;
  const variableCount = countTemplateVariables(template.bodyText ?? '');

  // Senders are the WABA's own numbers — reuses the phone-numbers tab query
  const { data: numbersResponse } = useWhatsappPhoneNumbers(accountId, { enabled: showSend });
  const senderOptions = useMemo<SelectOption[]>(
    () =>
      (numbersResponse?.result ?? []).map((number) => ({
        value: number.id,
        label: number.displayPhoneNumber,
        description: number.verifiedName,
      })),
    [numbersResponse],
  );

  const sendMutation = useSendWhatsappTemplateTest(accountId);

  const form = useForm<SendTemplateTestFormData>({
    resolver: zodResolver(sendTemplateTestSchema),
    defaultValues: {
      senderPhoneNumberId: '',
      to: '',
      bodyParams: Array.from({ length: variableCount }, () => ''),
    },
  });

  useEffect(() => {
    if (senderOptions.length === 1 && !form.getValues('senderPhoneNumberId')) {
      form.setValue('senderPhoneNumberId', String(senderOptions[0].value));
    }
  }, [senderOptions, form]);

  const bodyParams = form.watch('bodyParams');
  const previewBody = substituteVariables(template.bodyText ?? '', bodyParams ?? []);

  const preview = (
    <div className="flex flex-col items-center gap-3">
      <TemplatePreview
        header={template.headerText}
        body={previewBody}
        footer={template.footerText}
        buttons={template.buttons}
      />
      {template.rejectedReason && (
        <Typography variant="body2" className="text-destructive">
          Rejected: {template.rejectedReason.toLowerCase().replace(/_/g, ' ')}
        </Typography>
      )}
    </div>
  );

  if (!showSend) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-6 py-4">
          {preview}
          {variableCount > 0 && (
            <Typography variant="body2" intent="muted" className="text-center">
              {'{{n}}'} placeholders are filled with real values when a message is sent.
            </Typography>
          )}
          {!isApproved && (
            <Typography variant="body2" intent="muted" className="text-center">
              Only approved templates can be sent.
            </Typography>
          )}
        </div>
        <DialogActions>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </div>
    );
  }

  return (
    <Form
      form={form}
      mutation={sendMutation}
      transformSubmit={(data: SendTemplateTestFormData) => ({
        senderPhoneNumberId: data.senderPhoneNumberId,
        to: data.to,
        templateName: template.name,
        language: template.language ?? 'en',
        ...(template.category ? { category: template.category } : {}),
        ...(variableCount ? { bodyParams: data.bodyParams } : {}),
      })}
    >
      <div className="space-y-4">
        {preview}
        <div className="space-y-4 border-t pt-4">
          <Typography variant="body2" className="font-medium">
            Send a test message
          </Typography>
          <Select name="senderPhoneNumberId" label="From" placeholder="Select sender number" options={senderOptions} />
          <TextField name="to" label="To" placeholder="+919876543210" description="Recipient in international format" />
          {Array.from({ length: variableCount }, (_, i) => (
            <TextField key={`bodyParams.${i}`} name={`bodyParams.${i}`} label={`Value for {{${i + 1}}}`} />
          ))}
        </div>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button type="submit" loadingText="Sending..." startAdornment={<Send className="size-4" />}>
          Send test
        </Button>
      </DialogActions>
    </Form>
  );
};
