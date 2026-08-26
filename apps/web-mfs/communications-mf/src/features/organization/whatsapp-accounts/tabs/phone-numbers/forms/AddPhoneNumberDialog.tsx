import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Field, FieldLabel, Form } from '@vritti/quantum-ui/Form';
import { OTPField } from '@vritti/quantum-ui/OTPField';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { MessageSquare, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useAddWhatsappPhoneNumber,
  useRegisterWhatsappPhoneNumber,
  useRequestPhoneVerificationCode,
  useVerifyPhoneNumberCode,
} from '@/hooks/organization/whatsapp-accounts';
import {
  type AddPhoneNumberFormData,
  addPhoneNumberSchema,
  type RegisterPhonePinFormData,
  registerPhonePinSchema,
  type VerifyPhoneCodeFormData,
  verifyPhoneCodeSchema,
} from '@/schemas/whatsapp-phone-numbers';

interface AddPhoneNumberDialogProps {
  accountId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Mirrors Meta's lifecycle: create the number on the WABA → deliver an ownership code → verify it →
// register for Cloud API messaging with the two-step PIN. Closing early is safe — the number already
// exists on the WABA and shows as "Not verified" in the list until the remaining steps are done.
type WizardStep = 'details' | 'method' | 'code' | 'pin';

export const AddPhoneNumberDialog = ({ accountId, onSuccess, onCancel }: AddPhoneNumberDialogProps) => {
  const [step, setStep] = useState<WizardStep>('details');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [codeMethod, setCodeMethod] = useState<'SMS' | 'VOICE'>('SMS');

  const detailsForm = useForm<AddPhoneNumberFormData>({
    resolver: zodResolver(addPhoneNumberSchema),
    defaultValues: { cc: '91', phoneNumber: '', verifiedName: '' },
  });

  const codeForm = useForm<VerifyPhoneCodeFormData>({
    resolver: zodResolver(verifyPhoneCodeSchema),
    defaultValues: { code: '' },
  });

  const pinForm = useForm<RegisterPhonePinFormData>({
    resolver: zodResolver(registerPhonePinSchema),
    defaultValues: { pin: '' },
  });

  const addMutation = useAddWhatsappPhoneNumber({
    onSuccess: (response) => {
      setPhoneNumberId(response.data.id);
      setStep('method');
    },
  });

  const requestCodeMutation = useRequestPhoneVerificationCode({
    onSuccess: () => setStep('code'),
  });

  const verifyMutation = useVerifyPhoneNumberCode({
    onSuccess: () => setStep('pin'),
  });

  const registerMutation = useRegisterWhatsappPhoneNumber({
    onSuccess,
  });

  const requestCode = (method: 'SMS' | 'VOICE') => {
    setCodeMethod(method);
    requestCodeMutation.mutate({ accountId, phoneNumberId, data: { codeMethod: method } });
  };

  if (step === 'details') {
    return (
      <Form
        form={detailsForm}
        mutation={addMutation}
        transformSubmit={(data) => ({ accountId, data })}
        onCancel={onCancel}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <TextField name="cc" label="Country code" placeholder="91" />
            <TextField
              name="phoneNumber"
              label="Phone number"
              placeholder="9491700322"
              description="Without the country code. The number must not be in use by a WhatsApp app."
            />
          </div>
          <TextField
            name="verifiedName"
            label="Display name"
            placeholder="Vritti AI"
            description="Shown to WhatsApp users — Meta reviews it against your business."
          />
        </div>
        <DialogActions>
          <Button type="button" variant="outline" data-cancel>
            Cancel
          </Button>
          <Button type="submit" loadingText="Adding...">
            Add number
          </Button>
        </DialogActions>
      </Form>
    );
  }

  if (step === 'method') {
    return (
      <div className="space-y-4">
        <Typography variant="body2" intent="muted">
          The number was added. Meta now needs to confirm you own it — choose how to receive the 6-digit verification
          code.
        </Typography>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            startAdornment={<MessageSquare className="size-4" />}
            isLoading={requestCodeMutation.isPending && codeMethod === 'SMS'}
            disabled={requestCodeMutation.isPending}
            onClick={() => requestCode('SMS')}
          >
            Text message (SMS)
          </Button>
          <Button
            variant="outline"
            startAdornment={<PhoneCall className="size-4" />}
            isLoading={requestCodeMutation.isPending && codeMethod === 'VOICE'}
            disabled={requestCodeMutation.isPending}
            onClick={() => requestCode('VOICE')}
          >
            Voice call
          </Button>
        </div>
        <DialogActions>
          <Button type="button" variant="outline" onClick={onCancel}>
            Finish later
          </Button>
        </DialogActions>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <Form
        form={codeForm}
        mutation={verifyMutation}
        transformSubmit={(data) => ({ accountId, phoneNumberId, code: data.code })}
      >
        <div className="space-y-4">
          <Typography variant="body2" intent="muted" align="center">
            Enter the 6-digit code {codeMethod === 'SMS' ? 'sent to' : 'read out on a call to'} the number.
          </Typography>
          <Field>
            <FieldLabel className="sr-only">Verification code</FieldLabel>
            <OTPField name="code" />
          </Field>
          <Typography variant="body2" intent="muted" align="center">
            Didn't receive it?{' '}
            <Button
              variant="link"
              className="h-auto p-0 font-normal underline"
              onClick={() => requestCode(codeMethod)}
              isLoading={requestCodeMutation.isPending}
              loadingText="Sending..."
            >
              Resend code
            </Button>
          </Typography>
        </div>
        <DialogActions>
          <Button type="button" variant="outline" onClick={onCancel}>
            Finish later
          </Button>
          <Button type="submit" loadingText="Verifying...">
            Verify
          </Button>
        </DialogActions>
      </Form>
    );
  }

  return (
    <Form
      form={pinForm}
      mutation={registerMutation}
      transformSubmit={(data) => ({ accountId, phoneNumberId, pin: data.pin })}
    >
      <div className="space-y-4">
        <Typography variant="body2" intent="muted">
          Last step — set the number's two-step verification PIN to register it for messaging. If the number was
          registered before, enter its existing PIN.
        </Typography>
        <Field>
          <FieldLabel className="sr-only">Two-step verification PIN</FieldLabel>
          <OTPField name="pin" />
        </Field>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Finish later
        </Button>
        <Button type="submit" loadingText="Registering...">
          Register number
        </Button>
      </DialogActions>
    </Form>
  );
};
