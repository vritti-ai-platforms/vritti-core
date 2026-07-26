export const SOCIAL_PLATFORMS = {
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
  LINKEDIN: 'LINKEDIN',
  X: 'X',
  YOUTUBE: 'YOUTUBE',
  TIKTOK: 'TIKTOK',
  WEBSITE: 'WEBSITE',
} as const;

export type SocialPlatformValue = (typeof SOCIAL_PLATFORMS)[keyof typeof SOCIAL_PLATFORMS];
