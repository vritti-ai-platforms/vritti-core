import { UserDomainService } from '@domain/user/services/user.service';
import { Injectable } from '@nestjs/common';
import { OwnerNameService } from '@/owner-names/owner-name.service';
import type { PurchaseDetailResponseDto } from '../dto/response/purchase-detail-response.dto';
import type {
  PurchaseLegRejectionResponseDto,
  PurchaseLegResponseDto,
} from '../dto/response/purchase-leg-response.dto';

type UnnamedRejection = Omit<PurchaseLegRejectionResponseDto, 'actorName'>;

export type UnnamedPurchaseLeg = Omit<PurchaseLegResponseDto, 'approverNames' | 'approvedByName' | 'rejection'> & {
  rejection: UnnamedRejection | null;
};

export type UnnamedPurchase = Omit<PurchaseDetailResponseDto, 'siteName' | 'siteCode'>;

@Injectable()
export class PurchaseNamesService {
  constructor(
    private readonly ownerNames: OwnerNameService,
    private readonly userService: UserDomainService,
  ) {}

  // Fills a purchase's site name and code
  async withSiteName(orgId: string, purchase: UnnamedPurchase): Promise<PurchaseDetailResponseDto> {
    const [named] = await this.ownerNames.withSiteNames(orgId, [purchase]);
    return named;
  }

  // Fills the legs' approver, approved-by and rejected-by names from one batched user lookup
  async withLegNames(orgId: string, legs: UnnamedPurchaseLeg[]): Promise<PurchaseLegResponseDto[]> {
    const userIds = legs.flatMap((leg) => [...leg.approverUserIds, leg.approvedBy, leg.rejection?.actorId]);
    const names = await this.userService.findNamesByIds(orgId, PurchaseNamesService.present(userIds));
    return legs.map((leg) => PurchaseNamesService.nameLeg(leg, names));
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
