import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@vritti/api-sdk/exceptions';

// The operator has to get through Meta's flow in this window. Generous, because it can include
// creating a business portfolio and a phone number.
const TTL_MS = 15 * 60 * 1000;

export type EmbeddedSignupMode = 'connect' | 'reconnect';

export interface EmbeddedSignupState {
  orgId: string;
  userId: string;
  mode: EmbeddedSignupMode;
  accountId?: string;
  // Absolute URL on the tenant console to return to. Validated against BASE_DOMAIN when signed.
  returnUrl: string;
  // Unix ms
  exp: number;
}

const TAMPERED = {
  label: 'Invalid setup link',
  detail: 'This WhatsApp setup link could not be verified. Start the connect flow again from your console.',
};

/**
 * Carries one signup attempt across the origin hop, as a signed OAuth `state`.
 *
 * Something has to: the callback is a top-level navigation Meta initiates against a host with no org
 * subdomain, so it cannot work out which organization is acting. There is no bearer (the access
 * token lives in JS memory on the tenant origin), and the refresh cookie — which would reach this
 * host — names a user, not an organization.
 *
 * Deliberately stateless rather than a table. The one thing a stored nonce adds is strict single-use,
 * and Meta already enforces that on the thing that matters: the authorization code is single-use with
 * a 30-second TTL, so a replayed callback dies at the exchange. A replay that did win the race would
 * perform the very connect the operator asked for, into the organization sealed inside the MAC — so
 * there is nothing to gain from it.
 */
@Injectable()
export class EmbeddedSignupStateService {
  private readonly logger = new Logger(EmbeddedSignupStateService.name);
  private readonly key: string;

  constructor(private readonly configService: ConfigService) {
    // Same secret the CSRF protection is keyed with — this is the same class of job
    this.key = this.configService.getOrThrow<string>('HMAC_KEY');
  }

  sign(input: Omit<EmbeddedSignupState, 'exp'>): string {
    const state: EmbeddedSignupState = { ...input, exp: Date.now() + TTL_MS };
    const payload = Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');

    return `${payload}.${this.mac(payload)}`;
  }

  /**
   * Recovers an attempt from the `state` Meta echoed back.
   *
   * Expiry is reported rather than thrown: the signature still proves where the operator came from,
   * so an expired attempt can be sent back to its own console with an explanation. Only a forged or
   * malformed state leaves nowhere trustworthy to go, and that is what raises.
   */
  verify(raw: string | undefined): { state: EmbeddedSignupState; expired: boolean } {
    if (!raw) throw new BadRequestException(TAMPERED);

    const separator = raw.lastIndexOf('.');
    if (separator <= 0) throw new BadRequestException(TAMPERED);

    const payload = raw.slice(0, separator);
    const signature = raw.slice(separator + 1);

    if (!this.matches(payload, signature)) {
      this.logger.warn('Embedded Signup state failed signature verification — refusing it');
      throw new BadRequestException(TAMPERED);
    }

    let state: EmbeddedSignupState;
    try {
      state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as EmbeddedSignupState;
    } catch {
      throw new BadRequestException(TAMPERED);
    }

    // Signed by us, so the shape is ours — but a key rotation or a stale link from an older format
    // would land here, and a half-read state is worse than a rejected one
    if (!state.orgId || !state.userId || !state.mode || !state.returnUrl || !state.exp) {
      throw new BadRequestException(TAMPERED);
    }

    return { state, expired: state.exp < Date.now() };
  }

  private mac(payload: string): string {
    return createHmac('sha256', this.key).update(payload).digest('base64url');
  }

  // Constant-time, so a mismatch cannot be narrowed down by timing the comparison
  private matches(payload: string, signature: string): boolean {
    const expected = Buffer.from(this.mac(payload));
    const presented = Buffer.from(signature);

    return expected.length === presented.length && timingSafeEqual(expected, presented);
  }
}
