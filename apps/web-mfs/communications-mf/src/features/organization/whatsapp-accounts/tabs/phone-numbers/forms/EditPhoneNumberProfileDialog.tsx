import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { UploadFile } from '@vritti/quantum-ui/UploadFile';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { Camera, Phone } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useRequestPhoneNumberNameChange,
  useUpdatePhoneNumberProfilePicture,
  useWhatsappPhoneNumberProfile,
} from '@/hooks/organization/whatsapp-accounts';
import {
  type RequestNameChangeFormData,
  requestNameChangeSchema,
  type WhatsappPhoneNumberData,
} from '@/schemas/whatsapp-phone-numbers';

// Meta accepts JPEG/PNG for profile pictures; the canvas re-encodes to JPEG either way
const ACCEPTED_TYPES = 'image/png,image/jpeg';

const PICTURE_SIZE = 640;

// Cover-crops the image to a 640×640 JPEG and returns raw base64 (no data: prefix). Meta wants a
// square ≤5MB picture, and the resize also keeps the payload far below the NATS message cap.
async function resizeToSquareJpegBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = PICTURE_SIZE;
  canvas.height = PICTURE_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not supported in this browser');

  const scale = PICTURE_SIZE / Math.min(image.width, image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(image, (PICTURE_SIZE - width) / 2, (PICTURE_SIZE - height) / 2, width, height);

  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

// Local preview for the picked file. Built during render rather than in an effect so the avatar never
// blinks back to the old photo first, and revoked when the file changes or the dialog unmounts.
function usePickedFileUrl(file: File | undefined): string | null {
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!objectUrl) return;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  return objectUrl;
}

// Meta's display name review status for the number
const NameStatusBadge = ({ status }: { status: string | null }) => {
  if (!status || status === 'NONE') return null;
  if (status === 'APPROVED' || status === 'AVAILABLE_WITHOUT_REVIEW') return <Badge variant="success">Approved</Badge>;
  if (status === 'PENDING_REVIEW') return <Badge variant="secondary">Pending review</Badge>;
  if (status === 'DECLINED') return <Badge variant="destructive">Declined</Badge>;
  return <Badge variant="outline">{status.toLowerCase()}</Badge>;
};

interface EditPhoneNumberProfileDialogProps {
  accountId: string;
  phoneNumber: WhatsappPhoneNumberData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditPhoneNumberProfileDialog: React.FC<EditPhoneNumberProfileDialogProps> = ({
  accountId,
  phoneNumber,
  onSuccess,
  onCancel,
}) => {
  const { data: profile } = useWhatsappPhoneNumberProfile(accountId, phoneNumber.id);

  // Holds the picked file so the avatar updates on selection, and keeps holding it after the upload
  // succeeds: clearing there would flash the previous photo until the refetched profile arrives
  const [pickedFile, setPickedFile] = useState<File>();
  const pickedUrl = usePickedFileUrl(pickedFile);

  const pictureMutation = useUpdatePhoneNumberProfilePicture({
    onError: () => setPickedFile(undefined),
  });

  const nameForm = useForm<RequestNameChangeFormData>({
    resolver: zodResolver(requestNameChangeSchema),
    defaultValues: { newDisplayName: phoneNumber.verifiedName },
  });

  const nameChangeMutation = useRequestPhoneNumberNameChange({ onSuccess });

  // Uploads as soon as a file is picked — pictures apply immediately on Meta's side, so there is
  // no draft state worth submitting later
  async function handlePictureChange(files: File | File[] | undefined) {
    const file = Array.isArray(files) ? files[0] : files;
    if (!file) return;

    setPickedFile(file);
    const imageBase64 = await resizeToSquareJpegBase64(file);
    pictureMutation.mutate({
      accountId,
      phoneNumberId: phoneNumber.id,
      data: { imageBase64, mimeType: 'image/jpeg' },
    });
  }

  const imageSrc = pickedUrl ?? profile?.profilePictureUrl;

  const anchor = (
    <div className="group relative h-20 w-20">
      <div className="h-full w-full overflow-hidden rounded-full bg-muted">
        {imageSrc ? (
          <img src={imageSrc} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Phone className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary ring-2 ring-background">
        <Camera className="h-3 w-3 text-primary-foreground" />
      </div>
    </div>
  );

  return (
    <Form
      form={nameForm}
      mutation={nameChangeMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        accountId,
        phoneNumberId: phoneNumber.id,
        newDisplayName: data.newDisplayName,
      })}
    >
      <div className="space-y-6">
        <div className="flex items-start gap-6">
          {/* UploadFile's Field root is `flex w-full`, so it has to be boxed to the avatar's width or it
              claims the whole row and squeezes the copy beside it */}
          <div className={pictureMutation.isPending ? 'w-20 shrink-0 opacity-50' : 'w-20 shrink-0'}>
            <UploadFile
              anchor={anchor}
              accept={ACCEPTED_TYPES}
              value={pickedFile}
              onChange={handlePictureChange}
              disabled={pictureMutation.isPending}
            />
          </div>
          <div className="flex flex-1 flex-col items-start gap-2 pt-2">
            <Typography variant="body2" intent="muted">
              PNG or JPG, cropped to a 640×640 square. Click the photo to upload a new one — it applies immediately,
              without review.
            </Typography>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Typography variant="body2" className="font-medium">
              Display name
            </Typography>
            <NameStatusBadge status={phoneNumber.nameStatus} />
          </div>
          <TextField
            name="newDisplayName"
            label="New display name"
            description="Reviewed by Meta against your business — up to 10 changes per 30 days. Once approved, re-register the number to apply it."
          />
        </div>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Submitting...">
          Request name change
        </Button>
      </DialogActions>
    </Form>
  );
};
