import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

const SOCIAL_PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'X', 'YOUTUBE', 'TIKTOK', 'WEBSITE'] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const socialPlatformSchema = z.enum(SOCIAL_PLATFORMS);

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  X: 'X',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  WEBSITE: 'Website',
};

export const SOCIAL_PLATFORM_OPTIONS = SOCIAL_PLATFORMS.map((value) => ({
  value,
  label: SOCIAL_PLATFORM_LABELS[value],
}));

export const socialProfileSchema = z.object({
  platform: socialPlatformSchema,
  url: z.string().min(1, 'Profile URL is required').max(500, 'URL must be at most 500 characters'),
});

export type SocialProfileFormData = z.infer<typeof socialProfileSchema>;

export interface PartySocialProfilePayload {
  platform: SocialPlatform;
  url: string;
}

export interface PartySocialProfileRow {
  id: string;
  partyId: string;
  platform: SocialPlatform;
  url: string;
  createdAt: string;
}

export type PartySocialProfilesTableResponse = TableResponse<PartySocialProfileRow>;
