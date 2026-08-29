import { z } from '@vritti/quantum-ui/zod';

// Validation schema for password change form
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Account status enumeration matching backend
export enum AccountStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// Profile data interface matching backend ProfileDto
export interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  status: AccountStatus;
  locale: string;
  timezone: string;
  phone: string;
  createdAt: string;
  lastLoginAt: string | null;
  hasPassword: boolean;
  // Presigned, so it expires — see the staleTime note in useProfile
  profilePictureUrl: string | null;
}
