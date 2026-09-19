import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { ForbiddenException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { UpsertDimensionTemplateValuesDto } from '../dto/request/upsert-dimension-template-values.dto';
import {
  DimensionTemplateValuesDomainRepository,
  type TemplateSummary,
} from '../repositories/dimension-template-values.repository';

@Injectable()
export class DimensionTemplateValuesDomainService {
  private readonly logger = new Logger(DimensionTemplateValuesDomainService.name);

  constructor(private readonly repository: DimensionTemplateValuesDomainRepository) {}

  // Replaces a template's values with the set supplied. The whole set is rewritten rather than
  // diffed: nothing references a value's id (they are seeds that get copied onto a dimension), so
  // preserving row identity buys nothing, and a full replace makes two concurrent edits
  // last-write-wins instead of silently merging into a set neither caller asked for.
  //
  // Delete and insert are one transaction, so a failure can never leave the template with values
  // half-removed — or, worse, active with none, which is a state setActive refuses to create.
  async upsert(data: UpsertDimensionTemplateValuesDto): Promise<SuccessResponseDto> {
    return this.repository.transaction(async () => {
      const template = await this.requireOwnedTemplate(data.templateId);

      await this.repository.deleteAllForTemplate(data.templateId);
      await this.repository.createValues(
        data.values.map((entry, index) => ({
          templateId: data.templateId,
          code: entry.code,
          value: entry.value,
          sortOrder: index,
        })),
      );

      // An active template with no values would seed a dimension with nothing, so it goes back off
      if (data.values.length === 0 && template.isActive) {
        await this.repository.deactivateTemplate(data.templateId);
        this.logger.log(`Deactivated template ${data.templateId} — all values removed`);
        return {
          success: true,
          message: `All values removed from "${template.name}". It was deactivated because it has no values left.`,
        };
      }

      this.logger.log(`Replaced values for ${template.name}: ${data.values.length}`);
      return {
        success: true,
        message: `"${template.name}" now has ${pluralize('value', data.values.length, true)}.`,
      };
    });
  }

  // Loads the owning template, throwing if not found or owned by a wider scope
  private async requireOwnedTemplate(templateId: string): Promise<TemplateSummary> {
    const template = await this.repository.findTemplate(templateId);
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
