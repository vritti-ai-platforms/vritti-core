import type { ServiceType } from '@/db/schema';

export class ProvisionOrgServiceInternalDto {
  service: ServiceType;
  externalId?: string | null;
  externalName?: string | null;
}
