import { z } from '@vritti/quantum-ui/zod';

export const partyFunctionAssignmentSchema = z.object({
  function: z.string(),
  isPrimary: z.boolean().optional(),
});

export type PartyFunctionAssignment = z.infer<typeof partyFunctionAssignmentSchema>;

export interface PartyFunctionResponse {
  function: string;
  isPrimary: boolean;
}

export interface PartyFunctionOption {
  value: string;
  label: string;
}
