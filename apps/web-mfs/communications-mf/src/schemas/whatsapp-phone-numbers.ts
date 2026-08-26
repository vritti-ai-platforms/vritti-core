import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

// Step 1 of the add wizard — Meta takes the country code and national number separately
export const addPhoneNumberSchema = z.object({
  cc: z.string().min(1, 'Country code is required').max(4).regex(/^\d+$/, 'Digits only, without the plus sign'),
  phoneNumber: z.string().min(4, 'Enter the number without the country code').max(15).regex(/^\d+$/, 'Digits only'),
  verifiedName: z.string().min(1, 'Display name is required').max(255),
});

export type AddPhoneNumberFormData = z.infer<typeof addPhoneNumberSchema>;

// Step 3 — the 6-digit ownership code Meta delivers by SMS or voice call
export const verifyPhoneCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

export type VerifyPhoneCodeFormData = z.infer<typeof verifyPhoneCodeSchema>;

// Step 4 — the two-step verification PIN required to register for Cloud API messaging
export const registerPhonePinSchema = z.object({
  pin: z
    .string()
    .length(6, 'PIN must be 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});

export type RegisterPhonePinFormData = z.infer<typeof registerPhonePinSchema>;

// Mirrors WhatsappPhoneNumberResponseDto — read live from Meta, nothing stored locally
export interface WhatsappPhoneNumberData {
  id: string;
  displayPhoneNumber: string;
  verifiedName: string;
  codeVerificationStatus: string | null;
  qualityRating: string | null;
  platformType: string | null;
  throughputLevel: string | null;
  nameStatus: string | null;
}

// Mirrors WhatsappPhoneNumberProfileResponseDto
export interface WhatsappPhoneNumberProfileData {
  about: string | null;
  address: string | null;
  description: string | null;
  email: string | null;
  profilePictureUrl: string | null;
  vertical: string | null;
  websites: string[];
}

export interface UpdateProfilePictureData {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png';
}

// Display name changes go through Meta review — policy: reflects the business, no all-caps
export const requestNameChangeSchema = z.object({
  newDisplayName: z.string().min(3, 'Display name must be at least 3 characters').max(75),
});

export type RequestNameChangeFormData = z.infer<typeof requestNameChangeSchema>;

export type WhatsappPhoneNumbersTableResponse = TableResponse<WhatsappPhoneNumberData>;

export type AddWhatsappPhoneNumberData = AddPhoneNumberFormData;

export interface RequestPhoneCodeData {
  codeMethod: 'SMS' | 'VOICE';
  language?: string;
}
