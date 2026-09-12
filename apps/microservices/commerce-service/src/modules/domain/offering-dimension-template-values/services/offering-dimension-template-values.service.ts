import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { ForbiddenException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { UpsertOfferingDimensionTemplateValuesDto } from '../dto/request/upsert-offering-dimension-template-values.dto';
import {
  OfferingDimensionTemplateValuesDomainRepository,
  type ParentTemplate,
} from '../repositories/offering-dimension-template-values.repository';

@Injectable()
export class OfferingDimensionTemplateValuesDomainService {
  private readonly logger = new Logger(OfferingDimensionTemplateValuesDomainService.name);

  constructor(private readonly repository: OfferingDimensionTemplateValuesDomainRepository) {}

  // Replaces a template's values with the set supplied. The whole set is rewritten rather than
  // diffed: nothing references a value's id (they are seeds that get copied onto a dimension), so
  // preserving row identity buys nothing, and a full replace makes two concurrent edits
  // last-write-wins instead of silently merging into a set neither caller asked for.
  //
  // Delete and insert are one transaction, so a failure can never leave the template with values
  // half-removed — or, worse, active with none, which is a state setActive refuses to create.
  async upsert(data: UpsertOfferingDimensionTemplateValuesDto): Promise<SuccessResponseDto> {
    return this.repository.transaction(async () => {
      const template = await this.requireOwnedTemplate(data.templateId);

      // Case-insensitive dedupe, keeping the caller's order and first spelling
      // Deduped on code, which is the part that must be unique — it becomes a SKU segment
      const seen = new Set<string>();
      const values = data.values.filter((entry) => {
        const key = entry.code.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      await this.repository.deleteAllForTemplate(data.templateId);
      await this.repository.createValues(
        values.map((entry, index) => ({
          templateId: data.templateId,
          code: entry.code,
          value: entry.value,
          sortOrder: index,
        })),
      );

      // An active template with no values would seed a dimension with nothing, so it goes back off
      if (values.length === 0 && template.isActive) {
        await this.repository.deactivateTemplate(data.templateId);
        this.logger.log(`Deactivated template ${data.templateId} — all values removed`);
        return {
          success: true,
          message: `All values removed from "${template.name}". It was deactivated because it has no values left.`,
        };
      }

      this.logger.log(`Replaced values for ${template.name}: ${values.length}`);
      return {
        success: true,
        message: `"${template.name}" now has ${pluralize('value', values.length, true)}.`,
      };
    });
  }

  // RLS already hides out-of-reach templates and would reject the write; this fails earlier with a
  // message that explains why.
  private async requireOwnedTemplate(templateId: string): Promise<ParentTemplate> {
    const template = await this.repository.findParentTemplate(templateId);
    if (!template) throw new NotFoundException('Dimension template not found.');
    if (!template.isOwned) {
      throw new ForbiddenException({
        label: 'Not Your Template',
        detail: `"${template.name}" belongs to a wider scope. Switch to the workspace that owns it, or create your own.`,
      });
    }
    return template;
  }
}
