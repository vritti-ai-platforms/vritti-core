import { z } from '@vritti/quantum-ui-native/zod';

export const emailLookupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

export type EmailLookupFormValues = z.infer<typeof emailLookupSchema>;
