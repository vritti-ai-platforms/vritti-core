import { z } from 'zod';

// One schema for create + edit (the sheet edits all three fields). `code` mirrors the server rule:
// uppercase letters/digits/underscore, starting with a letter, unique per BU (the 409 surfaces on submit).
export const uomDimensionSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be 50 characters or fewer')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Uppercase letters, digits, _; must start with a letter'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  description: z.string().max(500, 'Description is too long').optional(),
});

export type UomDimensionFormValues = z.infer<typeof uomDimensionSchema>;
