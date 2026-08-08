import axios from '@vritti/quantum-ui/axios';
import type { ProfileData } from '@/schemas/account';

export interface ProfilePhotoResult {
  mediaId: string;
  url: string;
  expiresIn: number;
}

// Fetches the authenticated user's profile
export function getProfile(): Promise<ProfileData> {
  return axios.get<ProfileData>('account/profile', { showSuccessToast: false }).then((r) => r.data);
}

// Uploads a new profile photo, replacing any existing one. Content-Type is cleared so the browser sets the multipart
// boundary itself — axios cannot generate one.
export function uploadProfilePhoto(file: File): Promise<ProfilePhotoResult> {
  const formData = new FormData();
  formData.append('file', file);

  return axios
    .post<ProfilePhotoResult>('account/profile/photo', formData, {
      loadingMessage: 'Uploading photo...',
      successMessage: 'Profile photo updated',
      headers: { 'Content-Type': undefined },
    })
    .then((r) => r.data);
}

// Removes the current profile photo
export function deleteProfilePhoto(): Promise<void> {
  return axios
    .delete('account/profile/photo', {
      loadingMessage: 'Removing photo...',
      successMessage: 'Profile photo removed',
    })
    .then(() => undefined);
}
