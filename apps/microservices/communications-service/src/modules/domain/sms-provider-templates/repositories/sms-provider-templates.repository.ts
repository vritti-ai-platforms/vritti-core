import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type SmsProviderTemplate, smsProviderTemplates } from '@/db/schema';

@Injectable()
export class SmsProviderTemplatesDomainRepository extends PrimaryBaseRepository<typeof smsProviderTemplates> {
  constructor(database: PrimaryDatabaseService) {
    super(database, smsProviderTemplates);
  }

  // Every template registered against one provider, newest first
  findForProvider(providerId: string): Promise<SmsProviderTemplate[]> {
    return this.findMany({ where: { providerId }, orderBy: { createdAt: 'desc' } });
  }

  // Simple equality lookup — the duplicate check before an insert
  findByTemplateId(providerId: string, templateId: string): Promise<SmsProviderTemplate | undefined> {
    return this.findOne({ providerId, templateId });
  }

  // Clears a provider's templates when the provider itself is removed. There is no FK in this
  // schema to cascade for us, so the delete is explicit.
  async deleteForProvider(providerId: string): Promise<void> {
    await this.db.delete(smsProviderTemplates).where(eq(smsProviderTemplates.providerId, providerId));
  }
}
