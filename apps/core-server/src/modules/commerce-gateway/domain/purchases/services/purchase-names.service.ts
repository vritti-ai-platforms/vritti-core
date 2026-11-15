import { UserDomainService } from '@domain/user/services/user.service';
import { Injectable } from '@nestjs/common';
import { OwnerNameService } from '@/owner-names/owner-name.service';
import type { PurchaseEventResponseDto } from '../dto/response/purchase-event-response.dto';
import type { PurchaseEventsPageResponseDto } from '../dto/response/purchase-events-page-response.dto';
import type { PurchaseHeaderResponseDto } from '../dto/response/purchase-header-response.dto';
import type {
  PurchaseLegRejectionResponseDto,
  PurchaseLegResponseDto,
} from '../dto/response/purchase-leg-response.dto';

type UnnamedRejection = Omit<PurchaseLegRejectionResponseDto, 'actorName'>;

export type UnnamedPurchaseLeg = Omit<PurchaseLegResponseDto, 'approverNames' | 'approvedByName' | 'rejection'> & {
  rejection: UnnamedRejection | null;
};

type UnnamedEvent = Omit<PurchaseEventResponseDto, 'actorName'>;

export type UnnamedPurchaseEventsPage = { result: UnnamedEvent[]; count: number };

export type UnnamedPurchaseHeader = Omit<PurchaseHeaderResponseDto, 'siteName' | 'siteCode'>;

@Injectable()
export class PurchaseNamesService {
  constructor(
    private readonly ownerNames: OwnerNameService,
    private readonly userService: UserDomainService,
  ) {}

  // Fills a purchase header's site name and code
  async withHeaderNames(orgId: string, header: UnnamedPurchaseHeader): Promise<PurchaseHeaderResponseDto> {
    const [named] = await this.ownerNames.withSiteNames(orgId, [header]);
    return named;
  }

  // Fills the legs' approver, approved-by and rejected-by names from one batched user lookup
  async withLegNames(orgId: string, legs: UnnamedPurchaseLeg[]): Promise<PurchaseLegResponseDto[]> {
    const userIds = legs.flatMap((leg) => [...leg.approverUserIds, leg.approvedBy, leg.rejection?.actorId]);
    const names = await this.userService.findNamesByIds(orgId, PurchaseNamesService.present(userIds));
    return legs.map((leg) => PurchaseNamesService.nameLeg(leg, names));
  }

  // Fills the events' actor names from one batched user lookup
  async withEventNames(orgId: string, page: UnnamedPurchaseEventsPage): Promise<PurchaseEventsPageResponseDto> {
    const userIds = page.result.map((event) => event.actorId);
    const names = await this.userService.findNamesByIds(orgId, PurchaseNamesService.present(userIds));
    return {
      result: page.result.map((event) => ({
        ...event,
        actorName: PurchaseNamesService.nameOf(event.actorId, names),
      })),
      count: page.count,
    };
  }

  // Drops the missing user ids
  private static present(userIds: (string | null | undefined)[]): string[] {
    return userIds.filter((id): id is string => Boolean(id));
  }

  // Names a leg's approvers, its approver and the user who last rejected it
  private static nameLeg(leg: UnnamedPurchaseLeg, names: Map<string, string>): PurchaseLegResponseDto {
    return {
      ...leg,
      approverNames: leg.approverUserIds.flatMap((id) => names.get(id) ?? []),
      approvedByName: PurchaseNamesService.nameOf(leg.approvedBy, names),
      rejection: leg.rejection
        ? { ...leg.rejection, actorName: PurchaseNamesService.nameOf(leg.rejection.actorId, names) }
        : null,
    };
  }

  // Returns the name of a user, or null when there is no user or it is no longer in the organization
  private static nameOf(userId: string | null, names: Map<string, string>): string | null {
    return userId ? (names.get(userId) ?? null) : null;
  }
}
