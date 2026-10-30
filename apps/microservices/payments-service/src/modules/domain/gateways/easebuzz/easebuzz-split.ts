import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type {
  CreateLinkedAccountResult,
  CreateOrderInput,
  CreateTransferResult,
  GatewaySplitCapability,
  LinkedAccountLookup,
  LinkedAccountStatusResult,
} from '../gateway-transport';
import { toRupees } from './easebuzz-amount';

// Easebuzz names a split label in letters, digits and underscores; anything else cannot be one
const SPLIT_LABEL = /^[A-Za-z0-9_-]{1,100}$/;

// Easebuzz split payments. A split label is a bank account Easebuzz sets up on the merchant's account; a payment is
// split by `split_payments`, a JSON map of label to rupee amount sent when the payment is opened, and Easebuzz settles
// each share itself — so there is no linked-account setup and no transfer call to make here. The map must add up to
// the whole amount, so what the legs leave over goes to the config's main label. Easebuzz has no API that lists or
// checks labels, and opening a payment does not check them either: a payout account's label is stored as entered,
// and a wrong one only fails when someone pays
export class EasebuzzSplit implements GatewaySplitCapability {
  async createLinkedAccount(): Promise<CreateLinkedAccountResult> {
    throw labelsSetUpByEasebuzz();
  }

  async createTransfers(): Promise<CreateTransferResult[]> {
    throw new BadRequestException({
      label: 'Split Sent With Payment',
      detail: 'Easebuzz splits a payment with the shares sent when it is opened, so there is nothing to transfer now.',
    });
  }

  async fetchLinkedAccount(): Promise<LinkedAccountLookup | null> {
    throw labelsNotLookedUp();
  }

  async fetchLinkedAccountStatus(): Promise<LinkedAccountStatusResult> {
    throw labelsNotLookedUp();
  }

  // The payment's `split_payments`: each leg to its label, and the rest to the main label. Undefined when nothing is
  // split — no legs and no main label to send the whole amount to
  splitPayments(input: CreateOrderInput, amount: bigint): Record<string, string> | undefined {
    const legs = input.transfers ?? [];
    const shares = new Map<string, bigint>();
    for (const [index, leg] of legs.entries()) {
      const label = assertLabel(leg.providerAccountId, `transfers[${index}].providerAccountId`);
      shares.set(label, (shares.get(label) ?? 0n) + leg.amount);
    }

    const legTotal = [...shares.values()].reduce((sum, share) => sum + share, 0n);
    if (legTotal > amount) {
      throw new BadRequestException({
        label: 'Transfers Exceed Amount',
        detail: 'The split shares add up to more than the payment itself.',
        errors: [{ field: 'transfers', message: 'Total exceeds the amount' }],
      });
    }
    const remainder = amount - legTotal;
    const mainLabel = input.mainAccountId?.trim();
    if (remainder > 0n) {
      if (!mainLabel) {
        if (legs.length === 0) return undefined;
        throw new BadRequestException({
          label: 'Main Split Label Required',
          detail:
            "Easebuzz needs a split to cover the whole payment, so the share kept by the merchant must go to the gateway's main split label. Set it on the gateway in Vritti Cloud.",
          errors: [{ field: 'mainAccountId', message: 'Required for an Easebuzz split' }],
        });
      }
      const main = assertLabel(mainLabel, 'mainAccountId');
      shares.set(main, (shares.get(main) ?? 0n) + remainder);
    }

    return Object.fromEntries([...shares.entries()].map(([label, share]) => [label, toRupees(share)]));
  }

  // Easebuzz gives the shares no ids of their own; each is named after its payment and label so its leg is marked
  // sent and never sent again
  sentTransfers(txnid: string, transfers: CreateOrderInput['transfers']): CreateTransferResult[] {
    return (transfers ?? []).map((transfer) => ({
      providerTransferId: `${txnid}:${transfer.providerAccountId}`,
      providerAccountId: transfer.providerAccountId,
      amount: transfer.amount,
      status: 'PENDING' as const,
    }));
  }
}

function assertLabel(label: string, field: string): string {
  const trimmed = label.trim();
  if (!SPLIT_LABEL.test(trimmed)) {
    throw new BadRequestException({
      label: 'Invalid Split Label',
      detail: `"${trimmed}" is not an Easebuzz split label. Labels are letters, digits, dashes and underscores.`,
      errors: [{ field, message: 'Not a split label' }],
    });
  }
  return trimmed;
}

function labelsSetUpByEasebuzz(): BadRequestException {
  return new BadRequestException({
    label: 'Ask Easebuzz For A Split Label',
    detail: 'Easebuzz sets up split labels for a bank account on request. Enter the label as the payout account.',
  });
}

function labelsNotLookedUp(): BadRequestException {
  return new BadRequestException({
    label: 'Labels Cannot Be Looked Up',
    detail: 'Easebuzz cannot look a split label up; a wrong label fails when a payment is split to it.',
  });
}
