import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Typography } from '@vritti/quantum-ui/Typography';
import { UploadFile } from '@vritti/quantum-ui/UploadFile';
import { Camera, User } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDeleteProfilePhoto, useUploadProfilePhoto } from '@/hooks/account/profile';
import type { ProfileData } from '@/schemas/account';

// SVG is accepted by the media endpoint but deliberately left out here — an avatar is a raster image, and the
// narrower list keeps the file picker from offering something the user would only be surprised by.
const ACCEPTED_TYPES = 'image/png,image/jpeg,image/gif,image/webp';

// Local preview for the picked file. Built during render rather than in an effect so the avatar never blinks back to
// the old photo first, and revoked when the file changes or the card unmounts.
function usePickedFileUrl(file: File | undefined): string | null {
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!objectUrl) return;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  return objectUrl;
}

interface ProfilePhotoCardProps {
  profile: ProfileData;
}

export const ProfilePhotoCard: React.FC<ProfilePhotoCardProps> = ({ profile }) => {
  // Holds the picked file so the avatar updates on selection, and keeps holding it after the upload succeeds:
  // clearing there would flash the previous photo until the refetched profile arrives.
  const [pickedFile, setPickedFile] = useState<File>();
  const pickedUrl = usePickedFileUrl(pickedFile);

  const uploadMutation = useUploadProfilePhoto({
    onError: () => setPickedFile(undefined),
  });
  const deleteMutation = useDeleteProfilePhoto({
    onSuccess: () => setPickedFile(undefined),
  });

  const isBusy = uploadMutation.isPending || deleteMutation.isPending;
  const imageSrc = pickedUrl ?? profile.profilePictureUrl;

  // Uploads as soon as a file is picked — the rest of this page is read-only, so there is no edit mode to submit from
  function handleChange(files: File | File[] | undefined) {
    const file = Array.isArray(files) ? files[0] : files;
    if (!file) return;

    setPickedFile(file);
    uploadMutation.mutate(file);
  }

  // A custom anchor rather than the 'avatar' preset: the preset renders only files picked in this session, and the
  // already-saved photo has to show on first paint. Sized here rather than with <Avatar>, whose base is size-8 and
  // whose largest supported size is 40px — it would fight any class we passed for an 80px circle.
  const anchor = (
    <div className="group relative h-20 w-20">
      <div className="h-full w-full overflow-hidden rounded-full bg-muted">
        {imageSrc ? (
          <img src={imageSrc} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary ring-2 ring-background">
        <Camera className="h-3 w-3 text-primary-foreground" />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Photo</CardTitle>
        <CardDescription>Upload a photo to personalize your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          {/* UploadFile's Field root is `flex w-full`, so it has to be boxed to the avatar's width or it claims the
              whole row and squeezes the copy beside it down to the width of the Remove button */}
          <div className={isBusy ? 'w-20 shrink-0 opacity-50' : 'w-20 shrink-0'}>
            <UploadFile
              anchor={anchor}
              accept={ACCEPTED_TYPES}
              value={pickedFile}
              onChange={handleChange}
              disabled={isBusy}
            />
          </div>

          <div className="flex flex-1 flex-col items-start gap-2 pt-2">
            <Typography variant="body2" intent="muted">
              PNG, JPG, GIF or WebP. Click the photo to upload a new one.
            </Typography>
            {imageSrc && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => deleteMutation.mutate()}
              >
                Remove photo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
