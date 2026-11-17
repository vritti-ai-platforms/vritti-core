import type { PurchaseBlockers } from '../../repositories/purchases.repository';
import type { PurchaseAction } from './purchase.dto';

export class PurchaseActionsDto {
  availableActions: PurchaseAction[];
  blockers: PurchaseBlockers;

  // Shapes the actions a purchase offers and why the others are blocked
  static from(availableActions: PurchaseAction[], blockers: PurchaseBlockers): PurchaseActionsDto {
    const dto = new PurchaseActionsDto();
    dto.availableActions = availableActions;
    dto.blockers = blockers;
    return dto;
  }
}
