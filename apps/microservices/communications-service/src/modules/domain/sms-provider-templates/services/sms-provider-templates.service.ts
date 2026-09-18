import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { SmsProviderTemplate } from '@/db/schema';
import { SmsProviderTemplateDto } from '../dto/entity/sms-provider-template.dto';
import type { AddSmsProviderTemplateDto } from '../dto/request/add-sms-provider-template.dto';
import { SmsProviderTemplatesDomainRepository } from '../repositories/sms-provider-templates.repository';

/**
 * Storage for the templates registered against a provider.
 *
 * Deliberately knows nothing about MSG91. The vendor round-trip that proves a template exists
 * happens one layer up, in the organization-layer service that can reach both this domain and
 * `sms-providers` — domain modules never import each other, so the snapshot arrives here as an
 * argument rather than being fetched.
 */
@Injectable()
export class SmsProviderTemplatesDomainService {
  private readonly logger = new Logger(SmsProviderTemplatesDomainService.name);

  constructor(private readonly repository: SmsProviderTemplatesDomainRepository) {}

  async findForProvider(providerId: string): Promise<SmsProviderTemplateDto[]> {
    const rows = await this.repository.findForProvider(providerId);
    return rows.map(SmsProviderTemplateDto.from);
  }

  /**
   * The stored vendor snapshot for one template, for the send path.
   *
   * Returns undefined when the pair is unknown rather than throwing: whether a missing snapshot is
   * fatal is the transport's call — one that needs no template is unaffected, and MSG91 falls back
   * to a default variable name.
   */
  async findSnapshot(providerId: string, templateId: string): Promise<Record<string, unknown> | undefined> {
    const row = await this.repository.findByTemplateId(providerId, templateId);
    return row?.details;
  }

  // Records a template the caller has already confirmed with the vendor
  async add(
    providerId: string,
    data: AddSmsProviderTemplateDto,
    details: Record<string, unknown>,
  ): Promise<SmsProviderTemplateDto> {
    const existing = await this.repository.findByTemplateId(providerId, data.templateId);
    if (existing) {
      throw new ConflictException({
        label: 'Template already added',
        detail: `Template ${data.templateId} is already registered against this provider.`,
      });
    }

    const entity = await this.repository.create({
      providerId,
      templateId: data.templateId,
      name: data.name,
      details,
      syncedAt: new Date(),
    });

    this.logger.log(`Added SMS template ${data.templateId} to provider ${providerId}`);
    return SmsProviderTemplateDto.from(entity);
  }

  // Replaces the stored snapshot with a freshly fetched one
  async applyRefresh(id: string, details: Record<string, unknown>): Promise<SmsProviderTemplateDto> {
    const entity = await this.repository.update(id, { details, syncedAt: new Date() });
    return SmsProviderTemplateDto.from(entity);
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);
    await this.repository.delete(id);

    this.logger.log(`Removed SMS template ${existing.templateId} from provider ${existing.providerId}`);
    // Vritti forgets the row; the template itself is untouched at MSG91. The opposite of the
    // WhatsApp templates tab, whose delete reaches through to Meta.
    return { success: true, message: 'Template removed from Vritti. It still exists in MSG91.' };
  }

  // Called when the parent provider is deleted — no FK in this schema cascades for us
  deleteForProvider(providerId: string): Promise<void> {
    return this.repository.deleteForProvider(providerId);
  }

  // Internal — the org layer needs the entity (for its templateId) before it can call the vendor
  async requireById(id: string): Promise<SmsProviderTemplate> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Template not found.');
    return entity;
  }
}
