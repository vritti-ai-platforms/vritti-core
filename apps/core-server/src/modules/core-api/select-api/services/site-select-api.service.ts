import { SiteDomainService } from '@domain/site/services/site.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { SelectQueryResult } from '@vritti/api-sdk/select';
import type { SiteSelectQueryDto } from '../dto/site-select-query.dto';

@Injectable()
export class SiteSelectApiService {
  private readonly logger = new Logger(SiteSelectApiService.name);

  constructor(
    private readonly siteService: SiteDomainService,
    private readonly nats: NatsClientService,
  ) {}

  // The legal entity's active sites as select options, kept to the asked ids and, for a supplier or an inventory item,
  // to the sites enrolled at (or not yet) — commerce-service resolves the enrollments to site ids
  async findForSelect(legalEntityId: string | undefined, query: SiteSelectQueryDto): Promise<SelectQueryResult> {
    const { ids, supplierId, inventoryItemId, isEnrolled, isActive, ...select } = query;
    SiteSelectApiService.assertEnrollmentParams(query);
    if (!supplierId && !inventoryItemId)
      return this.siteService.findForLegalEntitySelect(legalEntityId, select, { siteIds: ids });

    // Any enrollment, active or not, keeps a site from being offered as not enrolled
    const enrolled = isEnrolled !== false;
    this.logger.log(
      `le.suppliers.enrollments.siteIds — supplierId: ${supplierId}, inventoryItemId: ${inventoryItemId}, isEnrolled: ${enrolled}, isActive: ${isActive}`,
    );
    const enrolledIds = await this.nats.send<string[]>('commerce', 'le.suppliers.enrollments.siteIds', {
      supplierId,
      inventoryItemId,
      isActive: enrolled && isActive,
    });
    if (!enrolled) {
      return this.siteService.findForLegalEntitySelect(legalEntityId, select, {
        siteIds: ids,
        excludeSiteIds: enrolledIds,
      });
    }
    return this.siteService.findForLegalEntitySelect(legalEntityId, select, {
      siteIds: ids ? ids.filter((id) => enrolledIds.includes(id)) : enrolledIds,
    });
  }

  // Enrollment params need exactly one of a supplier or an inventory item, and only enrolled sites can be active
  private static assertEnrollmentParams({
    supplierId,
    inventoryItemId,
    isEnrolled,
    isActive,
  }: SiteSelectQueryDto): void {
    if (supplierId && inventoryItemId) {
      throw new BadRequestException({
        label: 'Conflicting Parameters',
        detail: 'List sites by a supplier or by an inventory item, not both.',
        errors: [{ field: 'inventoryItemId', message: 'Not allowed with supplierId' }],
      });
    }
    if (!supplierId && !inventoryItemId && (isEnrolled !== undefined || isActive !== undefined)) {
      throw new BadRequestException({
        label: 'Supplier Required',
        detail: 'Enrollment filters need a supplier or an inventory item.',
        errors: [{ field: 'supplierId', message: 'Required with isEnrolled or isActive' }],
      });
    }
    if (isEnrolled === false && isActive !== undefined) {
      throw new BadRequestException({
        label: 'Conflicting Parameters',
        detail: 'Only enrolled sites can be filtered by whether they are active.',
        errors: [{ field: 'isActive', message: 'Not allowed with isEnrolled=false' }],
      });
    }
  }
}
