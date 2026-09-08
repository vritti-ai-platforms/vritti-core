import type { ConnectEmbeddedSignupDto } from '@communications/whatsapp-accounts/dto/request/connect-embedded-signup.dto';
import type { CreateEmbeddedSignupStateDto } from '@communications/whatsapp-accounts/dto/request/create-embedded-signup-state.dto';
import type { UpdateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
import type { EmbeddedSignupConfigResponseDto } from '@communications/whatsapp-accounts/dto/response/embedded-signup-config-response.dto';
import type { EmbeddedSignupStateResponseDto } from '@communications/whatsapp-accounts/dto/response/embedded-signup-state-response.dto';
import type { WhatsappAccountResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-response.dto';
import type { WhatsappAccountTableResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { AppDomainService } from '@/modules/domain/app/services/app.service';
import {
  EMBEDDED_SIGNUP_BROKER_PATH,
  EMBEDDED_SIGNUP_CALLBACK_PATH,
} from '../../../embedded-signup/embedded-signup.constants';
import { EmbeddedSignupStateService } from '../../../embedded-signup/services/embedded-signup-state.service';

// Must track GRAPH_API_VERSION in communications-service's MetaGraphHttpService: the dialog and the
// server-side calls that follow it have to speak the same Graph version.
const GRAPH_API_VERSION = 'v26.0';

/**
 * Subdomain the signup flow is served from.
 *
 * This server's own host, because that is what already routes here — the flow's routes are
 * core-server routes, reachable on any hostname that reaches core-server, so a dedicated `connect.`
 * name would have been decoration rather than isolation. Meta only requires that ONE fixed origin is
 * registered, and this one already has DNS, a certificate and a proxy rule.
 *
 * Combined with BASE_DOMAIN rather than configured separately, so it cannot drift out of step with
 * the domain the console runs on.
 */
const CONNECT_SUBDOMAIN = 'api';

/**
 * Everything the broker needs to build Meta's dialog URL.
 *
 * Internal, and not a Swagger DTO: none of it reaches a browser any more. `enabled` lives here too
 * so the one gate is computed in a single place rather than re-derived by each caller.
 */
export interface EmbeddedSignupSettings {
  appId: string;
  configId: string | null;
  graphVersion: string;
  enabled: boolean;
}

@Injectable()
export class WhatsappAccountsGatewayService {
  private readonly logger = new Logger(WhatsappAccountsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly appService: AppDomainService,
    private readonly configService: ConfigService,
    private readonly signupStateService: EmbeddedSignupStateService,
  ) {}

  /**
   * Server-side settings for the signup flow. The app secret is not among them — it stays in
   * communications-service, which is where the code exchange happens, so the minted token never
   * crosses NATS.
   */
  embeddedSignupSettings(): EmbeddedSignupSettings {
    const configId = this.configService.get<string>('META_EMBEDDED_SIGNUP_CONFIG_ID') ?? null;

    return {
      appId: this.configService.getOrThrow<string>('META_CLIENT_ID'),
      configId,
      graphVersion: GRAPH_API_VERSION,
      // The broker origin always resolves (it falls back to connect.<BASE_DOMAIN>) and the app id is
      // required at boot, so the Facebook Login configuration is the only prerequisite a deployment
      // can actually be missing — without it there is nothing to open, and the UI hides its button
      // rather than starting a flow that cannot finish.
      enabled: Boolean(configId),
    };
  }

  // What the console is told: one flag, because one flag is all it acts on
  embeddedSignupConfig(): EmbeddedSignupConfigResponseDto {
    return { enabled: this.embeddedSignupSettings().enabled };
  }

  /**
   * Starts a connect attempt and returns where to run it.
   *
   * The permission gate lives here rather than on the completion endpoint, which is public by
   * necessity — the broker origin has no session. This is the last point in the flow where a
   * caller's grants can be checked, so `add` is enforced on this route.
   */
  createConnectState(
    organizationId: string,
    userId: string,
    dto: CreateEmbeddedSignupStateDto,
  ): EmbeddedSignupStateResponseDto {
    const state = this.signupStateService.sign({
      orgId: organizationId,
      userId,
      mode: 'connect',
      returnUrl: this.assertOwnReturnUrl(dto.returnUrl),
    });

    return { url: this.brokerUrl(state) };
  }

  // Starts a reconnect attempt against one existing account. Gated on `edit`, and the account id is
  // carried in the state rather than by the browser, so the completion cannot be pointed elsewhere.
  createReconnectState(
    accountId: string,
    organizationId: string,
    userId: string,
    dto: CreateEmbeddedSignupStateDto,
  ): EmbeddedSignupStateResponseDto {
    const state = this.signupStateService.sign({
      orgId: organizationId,
      userId,
      mode: 'reconnect',
      accountId,
      returnUrl: this.assertOwnReturnUrl(dto.returnUrl),
    });

    return { url: this.brokerUrl(state) };
  }

  // Connects a WABA from an Embedded Signup result. The authorization code is forwarded, never the
  // token — the exchange and the ownership check both happen downstream.
  connectEmbedded(dto: ConnectEmbeddedSignupDto): Promise<CreateResponseDto<WhatsappAccountResponseDto>> {
    this.logger.log('whatsappAccounts.connectEmbedded');
    return this.nats.send('communications', 'org.whatsappAccounts.connectEmbedded', dto);
  }

  // Returns paginated, filtered, and sorted WhatsApp accounts for the data table
  async findForTable(userId: string): Promise<WhatsappAccountTableResponseDto> {
    this.logger.log('org.whatsappAccounts.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'communications-org-whatsapp-accounts',
    );

    const { result, count } = await this.nats.send<{ result: WhatsappAccountResponseDto[]; count: number }>(
      'communications',
      'org.whatsappAccounts.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Replaces one account's credential from a fresh signup result, keeping its id
  reconnect(id: string, dto: ConnectEmbeddedSignupDto): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.reconnectEmbedded — id: ${id}`);
    return this.nats.send('communications', 'org.whatsappAccounts.reconnectEmbedded', { id, ...dto });
  }

  // Finds a WhatsApp account by ID
  findById(id: string): Promise<WhatsappAccountResponseDto> {
    this.logger.log(`whatsappAccounts.findById — id: ${id}`);
    return this.nats.send('communications', 'org.whatsappAccounts.findById', { id });
  }

  // Updates a WhatsApp account by ID
  update(id: string, dto: UpdateWhatsappAccountDto): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.update — id: ${id}`);
    return this.nats.send('communications', 'org.whatsappAccounts.update', { id, ...dto });
  }

  // Disconnects a WhatsApp account by ID, refusing while an app still sends sign-in codes from it
  async delete(id: string, organizationId: string): Promise<SuccessResponseDto> {
    // No foreign key spans the core/communications boundary, so this server is the only place that
    // can see both sides — miss it and a live storefront starts failing at Meta instead
    const dependents = await this.appService.findByOtpAccount(organizationId, id);
    if (dependents.length > 0) {
      const names = dependents.map((app) => app.name).join(', ');
      throw new ConflictException({
        label: 'Account in use',
        detail: `Cannot disconnect this account while ${pluralize('app', dependents.length, true)} send sign-in codes from it: ${names}. Change their WhatsApp OTP configuration first.`,
      });
    }

    this.logger.log(`whatsappAccounts.delete — id: ${id}`);
    return this.nats.send('communications', 'org.whatsappAccounts.delete', { id });
  }

  /**
   * Absolute URL Meta redirects back to once the flow finishes.
   *
   * The one value that has to be registered in the Meta app's "Valid OAuth Redirect URIs" list, and
   * it is built here so it cannot drift from the origin the console actually sends operators to.
   */
  embeddedSignupCallbackUrl(): string {
    return `${this.brokerBaseUrl()}${EMBEDDED_SIGNUP_CALLBACK_PATH}`;
  }

  /**
   * Public origin that serves the signup flow.
   *
   * Derived rather than configured. Every input is something this server already validates at boot,
   * and it *is* the server being addressed — so unlike the mobile client, which has to be told the
   * API's address, there is nothing here to look up.
   *
   * The only judgement call is the port, and `USE_HTTPS` is what settles it: it answers whether this
   * process terminates TLS, which is the same question as whether the browser reaches it on this
   * port. Behind a proxy the edge holds 443 and this listener's port is private; served directly, the
   * port is part of the public address.
   *
   * NODE_ENV deliberately does NOT decide it. The apw1 deployment runs `NODE_ENV=production` while
   * still being served directly on 3001, so treating "production" as proxied emitted
   * `https://api.local.vrittiai.com` there — an origin with nothing listening on it. Naming an
   * environment and describing its topology are different things.
   *
   * Always https, never `USE_HTTPS ? 'https' : 'http'`: Meta refuses a plaintext redirect URI, so an
   * http origin could only ever produce a URI it rejects. Better to emit the https form and fail at
   * connection time, which says something.
   */
  private brokerBaseUrl(): string {
    const host = `${CONNECT_SUBDOMAIN}.${this.configService.getOrThrow<string>('BASE_DOMAIN')}`;

    // Compared as a string: `validate()` returns the raw environment rather than the
    // class-transformed instance, so this arrives as 'true' — and typing it as a boolean would make
    // 'false' truthy
    const terminatesTls = String(this.configService.get('USE_HTTPS')) === 'true';
    const port = Number(this.configService.get('PORT'));

    // 443 is omitted even when terminating TLS here: Meta matches the redirect URI exactly, and
    // `:443` would not match a registration written without it
    const suffix = terminatesTls && port && port !== 443 ? `:${port}` : '';

    return `https://${host}${suffix}`;
  }

  private brokerUrl(state: string): string {
    // The state is base64url plus a '.', so encoding is a no-op today — kept so it stays correct if
    // the payload format ever changes
    return `${this.brokerBaseUrl()}${EMBEDDED_SIGNUP_BROKER_PATH}?state=${encodeURIComponent(state)}`;
  }

  /**
   * Holds the caller's return URL to this deployment's own base domain.
   *
   * The URL is signed into the state and the callback redirects to it, so without this check a
   * caller could aim the end of the flow at a site they control — and the redirect would carry the
   * outcome of a connect performed for their organization.
   */
  private assertOwnReturnUrl(returnUrl: string): string {
    const baseDomain = this.configService.get<string>('BASE_DOMAIN');
    const rejected = {
      label: 'Unrecognised address',
      detail: 'The WhatsApp setup flow could not be started from this address.',
    };

    if (!baseDomain) throw new BadRequestException(rejected);

    let url: URL;
    try {
      url = new URL(returnUrl);
    } catch {
      throw new BadRequestException(rejected);
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new BadRequestException(rejected);

    // Matched on the parsed hostname, not with endsWith on the whole URL, so a lookalike domain
    // ending in the base domain cannot satisfy it
    if (url.hostname !== baseDomain && !url.hostname.endsWith(`.${baseDomain}`)) {
      this.logger.warn(`Refusing to start a signup returning to ${url.hostname} — outside ${baseDomain}`);
      throw new BadRequestException(rejected);
    }

    return url.toString();
  }
}
