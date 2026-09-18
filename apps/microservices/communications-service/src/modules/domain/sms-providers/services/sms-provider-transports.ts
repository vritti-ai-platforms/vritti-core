import type { Msg91Envelope } from '@domain/msg91/msg91-error.util';
import { Msg91HttpService } from '@domain/msg91/services/msg91-http.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { SmsProviderCode } from '@/db/schema';

export interface SmsOtpDelivery {
  recipient: string;
  code: string;
  senderId: string | null;
  credentials: Record<string, unknown>;
  appId: string;
  // Vendor template the code is rendered into, for providers that require one — from the app's
  // SMS OTP config
  templateId?: string;
  // The stored vendor snapshot for that template, passed through UNINTERPRETED. Placeholder syntax,
  // variable count and response shape are all vendor-specific, so only the transport reads it —
  // deriving a variable name upstream would put MSG91's `##name##` grammar in provider-agnostic code.
  template?: SmsTemplateSnapshot;
}

export interface SmsSendOutcome {
  // The vendor's message id when it issues one — the delivery-webhook correlation key
  messageId: string | null;
}

// What a template looks like to us: an opaque vendor payload. MSG91 publishes no response schema
// for `getVersions`, so this is stored whole rather than mapped into invented fields.
export type SmsTemplateSnapshot = Record<string, unknown>;

/**
 * What a provider can do, as advertised to the UI.
 *
 * The registry is the only honest answer to "which providers can I connect?" — a static enum
 * duplicated across layers drifts the moment a transport is added or removed, which is exactly how
 * TWILIO came to be offered in the connect dropdown with nothing behind it.
 */
export interface SmsProviderCapabilities {
  code: SmsProviderCode;
  requiresTemplate: boolean;
  requiresCredentials: boolean;
  supportsTemplates: boolean;
}

// One implementation per provider code. A transport owns its credential shape and message format;
// everything upstream (config, budgets, hashing, stats) is provider-agnostic.
export interface SmsProviderTransport {
  readonly code: SmsProviderCode;
  // Whether a send through this provider is addressed by a vendor template. India's DLT regime
  // makes this true for MSG91 and false for a transport that sends a bare body.
  readonly requiresTemplate: boolean;
  // Whether connecting this provider needs secrets at all — false for the console transport
  readonly requiresCredentials: boolean;
  sendOtp(delivery: SmsOtpDelivery): Promise<SmsSendOutcome>;
  // Reads one template from the vendor. Present only on transports that have templates at all —
  // the registry refuses the operation for the rest rather than each one stubbing it.
  fetchTemplate?(credentials: Record<string, unknown>, templateId: string): Promise<SmsTemplateSnapshot>;
  // Proves the stored credentials work, without sending anything. Optional: a transport with no
  // credentials (the console one) has nothing to prove.
  verifyCredentials?(credentials: Record<string, unknown>): Promise<void>;
}

// Dev-only stand-in: "delivers" by logging the code to the service console. Never production —
// the plaintext code lands in the logs, which is the entire point and the entire problem.
@Injectable()
export class ConsoleSmsTransport implements SmsProviderTransport {
  readonly code = 'CONSOLE' as const;
  readonly requiresTemplate = false;
  readonly requiresCredentials = false;
  private readonly logger = new Logger(ConsoleSmsTransport.name);

  async sendOtp(delivery: SmsOtpDelivery): Promise<SmsSendOutcome> {
    this.logger.log(
      `[CONSOLE SMS] OTP ${delivery.code} → ${delivery.recipient} (app ${delivery.appId}, sender ${delivery.senderId ?? '—'})`,
    );
    return { messageId: null };
  }
}

// MSG91's response to a successful send. The message id arrives in `message` — the same field that
// carries the reason on a failure, which is why `type` has to be checked (the HTTP client does it).
interface Msg91SendResponse extends Msg91Envelope {
  message?: string;
}

/**
 * One version row from POST /v5/sms/getTemplateVersions, verified against a live account.
 *
 * `template_data` carries the approved body with MSG91's `##name##` placeholders — it is the only
 * place the variable name is discoverable, and that name is what a send must key the code under.
 */
export interface Msg91TemplateVersion {
  template_id?: string;
  template_name?: string;
  template_data?: string;
  DLT_ID?: string;
  sender_id?: string;
  version?: string;
  status?: string;
  active_status?: string;
  sms_type?: string;
  dlt_verified?: string;
  reject_reason?: string;
}

// Left open on top of the typed `data`: the snapshot is stored whole, so any field MSG91 adds
// later is kept rather than silently dropped
type Msg91TemplateResponse = Msg91Envelope & { data?: Msg91TemplateVersion[] } & Record<string, unknown>;

@Injectable()
export class Msg91SmsTransport implements SmsProviderTransport {
  readonly code = 'MSG91' as const;
  readonly requiresTemplate = true;
  readonly requiresCredentials = true;
  private readonly logger = new Logger(Msg91SmsTransport.name);

  constructor(private readonly http: Msg91HttpService) {}

  /**
   * Sends through MSG91's Flow API, rendering our code into an approved DLT template.
   *
   * Deliberately the Flow API and not MSG91's OTP API: we generate the code, hash it, and own the
   * expiry, attempt budget and cooldown. Handing that to MSG91 would duplicate the state machine
   * and make this provider behave unlike every other one in the registry.
   */
  async sendOtp(delivery: SmsOtpDelivery): Promise<SmsSendOutcome> {
    const authKey = this.requireAuthKey(delivery.credentials);

    if (!delivery.templateId) {
      throw new BadRequestException({
        label: 'No template configured',
        detail:
          'MSG91 sends through a DLT-approved template. Add one to this provider, then select it on the app’s SMS sign-in configuration.',
      });
    }

    const response = await this.http.post<Msg91SendResponse>(authKey, '/v5/flow', {
      template_id: delivery.templateId,
      // MSG91 wants a bare international number; our recipients are validated E.164, so the
      // leading + has to come off or the number is rejected as malformed
      recipients: [
        { mobiles: delivery.recipient.replace(/^\+/, ''), ...this.resolveVariables(delivery.template, delivery.code) },
      ],
      ...(delivery.senderId ? { sender: delivery.senderId } : {}),
    });

    return { messageId: response.message ?? null };
  }

  /**
   * Keys the code by the variable the approved template actually declares.
   *
   * MSG91 matches variable names exactly and case-sensitively, so a hardcoded `var1` silently
   * delivers an empty code against a template written as `##number##` — which is what Desi Taakat's
   * template uses. The name is only discoverable from `template_data`, so it is read from the
   * stored snapshot at send time.
   *
   * Falls back to `var1` when there is no snapshot or no placeholder: the send then either works
   * (templates that happen to use var1) or fails loudly at MSG91, both better than guessing wrong
   * and silently sending nothing.
   */
  private resolveVariables(template: SmsTemplateSnapshot | undefined, code: string): Record<string, string> {
    const body = (template?.data as Msg91TemplateVersion[] | undefined)?.[0]?.template_data;
    const variable = typeof body === 'string' ? body.match(/##(\w+)##/)?.[1] : undefined;
    return { [variable ?? 'var1']: code };
  }

  /**
   * Reads a template by id, and refuses one the account does not actually have.
   *
   * Also the only real proof the stored auth key works — MSG91 publishes no side-effect-free
   * credential check, so a rejected key surfaces here.
   *
   * POST /v5/sms/getTemplateVersions is MSG91's documented template read. An earlier build called
   * `GET /v5/flow/getVersions` — taken from a third-party OpenAPI mirror, not MSG91's own docs —
   * which answered every input, valid or garbage, with `{type:"success", message:"<request id>"}`
   * and so validated nothing. `assertFound` guards the same class of mistake: a response carrying
   * nothing beyond the envelope describes no template.
   */
  async fetchTemplate(credentials: Record<string, unknown>, templateId: string): Promise<SmsTemplateSnapshot> {
    const authKey = this.requireAuthKey(credentials);
    this.logger.log(`Fetching MSG91 template ${templateId}`);

    const response = await this.http.post<Msg91TemplateResponse>(authKey, '/v5/sms/getTemplateVersions', {
      template_id: templateId,
    });

    // Logged so the first real fetch reveals the shape MSG91 documents nowhere — once one payload
    // has been seen, this check can assert on real fields instead of mere presence
    this.logger.debug(`MSG91 getVersions(${templateId}) → ${JSON.stringify(response)}`);
    this.assertFound(response, templateId);
    return response;
  }

  // A miss comes back as HTTP 200 with an empty `data` array (the envelope check upstream catches
  // the accompanying hasError, but this stands on its own so an envelope change cannot silently
  // reopen the hole that let any string be stored).
  private assertFound(response: Msg91TemplateResponse, templateId: string): void {
    if (!response?.data?.length) {
      throw new NotFoundException({
        label: 'Template not found',
        detail: `MSG91 has no template ${templateId} on this account. Check the ID in the MSG91 panel — it is the flow/template ID, not the DLT template ID.`,
      });
    }
  }

  /**
   * Proves an auth key works before it is stored.
   *
   * MSG91 publishes no dedicated credential check — no whoami, and the only SMS balance endpoint is
   * WhatsApp's. The SMS analytics report is the next best thing and is the right shape for a probe:
   * a GET, read-only, every parameter optional, rejected with 401/403 when the key is bad. The
   * window is a single day purely to keep the response small; the body is discarded either way.
   */
  async verifyCredentials(credentials: Record<string, unknown>): Promise<void> {
    const authKey = this.requireAuthKey(credentials);
    const today = new Date().toISOString().slice(0, 10);

    await this.http.get<Msg91Envelope>(authKey, '/v5/report/sms/analytics', {
      start_date: today,
      end_date: today,
    });
    this.logger.log('MSG91 auth key verified');
  }

  private requireAuthKey(credentials: Record<string, unknown>): string {
    const authKey = credentials.authKey;
    if (typeof authKey !== 'string' || !authKey.trim()) {
      throw new BadRequestException({
        label: 'MSG91 not configured',
        detail: 'This provider has no MSG91 auth key stored. Edit it and supply the key from your MSG91 panel.',
      });
    }
    return authKey;
  }
}

// Resolves a provider code to its transport. TWILIO joins here as one class — nothing upstream
// changes when it lands.
@Injectable()
export class SmsProviderRegistry {
  private readonly transports: Map<SmsProviderCode, SmsProviderTransport>;

  constructor(consoleTransport: ConsoleSmsTransport, msg91Transport: Msg91SmsTransport) {
    this.transports = new Map<SmsProviderCode, SmsProviderTransport>([
      [consoleTransport.code, consoleTransport],
      [msg91Transport.code, msg91Transport],
    ]);
  }

  resolve(code: SmsProviderCode): SmsProviderTransport {
    const transport = this.transports.get(code);
    if (!transport) {
      throw new BadRequestException({
        label: 'SMS provider not implemented',
        detail: `Sending through ${code} is not available yet. Pick a different provider.`,
      });
    }
    return transport;
  }

  // Every provider that actually has an implementation behind it, and what each one supports
  available(): SmsProviderCapabilities[] {
    return [...this.transports.values()].map((transport) => ({
      code: transport.code,
      requiresTemplate: transport.requiresTemplate,
      requiresCredentials: transport.requiresCredentials,
      supportsTemplates: !!transport.fetchTemplate,
    }));
  }

  // Verifies credentials against the vendor where the transport can. Reads the map directly rather
  // than going through resolve(): a code with no transport has nothing to verify, and throwing here
  // would refuse to even STORE such a provider — a different question from whether it can send.
  async verifyCredentials(code: SmsProviderCode, credentials: Record<string, unknown>): Promise<void> {
    await this.transports.get(code)?.verifyCredentials?.(credentials);
  }

  // Resolves a transport that can read templates, refusing the ones that have no such concept —
  // asking Twilio or the console transport for a template list is a caller error, not an empty list
  resolveTemplateCapable(code: SmsProviderCode): Required<Pick<SmsProviderTransport, 'fetchTemplate'>> {
    const transport = this.resolve(code);
    if (!transport.fetchTemplate) {
      throw new BadRequestException({
        label: 'Templates not supported',
        detail: `${code} does not use message templates, so there is nothing to add here.`,
      });
    }
    return { fetchTemplate: transport.fetchTemplate.bind(transport) };
  }
}
