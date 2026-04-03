import axios from '@vritti/quantum-ui/axios';
import type { ProfileData } from '@/schemas/account';

// Fetches the authenticated user's profile
export function getProfile(): Promise<ProfileData> {
  return axios.get<ProfileData>('account/profile', { showSuccessToast: false }).then((r) => r.data);
}
