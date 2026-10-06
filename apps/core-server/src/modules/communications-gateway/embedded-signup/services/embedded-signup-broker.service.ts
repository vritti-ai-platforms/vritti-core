import { HttpException, Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { FastifyRequest } from 'fastify';
import { WhatsappAccountsGatewayService } from '../../org-api/whatsapp-accounts/services/whatsapp-accounts-gateway.service';
import { type EmbeddedSignupState, EmbeddedSignupStateService } from './embedded-signup-state.service';

const EMBEDDED_SIGNUP_VERSION = 'v4-public-preview';

// Query keys the console reads off its own URL when the flow returns
const RESULT_PARAM = 'whatsapp';
const MESSAGE_PARAM = 'whatsappMessage';

// Meta's text can be long, and this ends up in a URL the browser displays
const MAX_MESSAGE_LENGTH = 300;

const GENERIC_FAILURE = 'WhatsApp setup could not be completed. Please start the connect flow again.';
const CANCELLED = 'WhatsApp setup was cancelled.';
const EXPIRED = 'This WhatsApp setup link expired before it was finished. Please try again.';

export interface EmbeddedSignupCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  error_reason?: string;
}

@Injectable()
export class EmbeddedSignupBrokerService {
  private readonly logger = new Logger(EmbeddedSignupBrokerService.name);

  constructor(
    private readonly stateService: EmbeddedSignupStateService,
    private readonly accountsGateway: WhatsappAccountsGatewayService,
  ) {}

  // Where to send the operator to run one attempt
  resolveDialogUrl(raw: string | undefined): string {
    const { state, expired } = this.stateService.verify(raw);
    if (expired) return this.returnTo(state, false, EXPIRED);

    const config = this.accountsGateway.embeddedSignupSettings();
    if (!config.enabled || !config.configId) {
      this.logger.warn('Embedded Signup started but this deployment is not configured for it');
      return this.returnTo(state, false, 'WhatsApp sign-up is not configured for this environment yet.');
    }

    const params = new URLSearchParams({
      client_id: config.appId,
      config_id: config.configId,
      response_type: 'code',
      override_default_response_type: 'true',
      redirect_uri: this.accountsGateway.embeddedSignupCallbackUrl(),
      // Must be echoed back untouched — it is the only thing naming the organization
      state: raw as string,
      extras: JSON.stringify({ version: EMBEDDED_SIGNUP_VERSION }),
    });

    this.logger.log(`Starting ${state.mode} for org ${state.orgId} on ${EMBEDDED_SIGNUP_VERSION}`);
    return `https://www.facebook.com/${config.graphVersion}/dialog/oauth?${params.toString()}`;
  }

  // Completes one attempt from Meta's redirect, then hands the operator back to their console
  async handleCallback(request: FastifyRequest, query: EmbeddedSignupCallbackQuery): Promise<string> {
    // Raises on a forged or malformed state — there is then no trustworthy address to return to,
    // which is the one case that cannot be reported by redirecting
    const { state, expired } = this.stateService.verify(query.state);

    if (expired) return this.returnTo(state, false, EXPIRED);

    // The operator declined or backed out
    if (query.error || !query.code) {
      this.logger.log(`Embedded Signup returned without a code — error: ${query.error ?? 'none'}`);
      return this.returnTo(state, false, query.error ? (query.error_description ?? CANCELLED) : GENERIC_FAILURE);
    }

    // The NATS context resolver reads `request.auth`, and this route has none — it is public
    request.auth = { kind: 'cloud', organizationId: state.orgId };

    // The code is single-use and short-lived, so it is never logged
    this.logger.log(`Completing ${state.mode} for org ${state.orgId}`);

    try {
      const signup = { code: query.code, redirectUri: this.accountsGateway.embeddedSignupCallbackUrl() };

      if (state.mode === 'reconnect') {
        if (!state.accountId) {
          throw new BadRequestException({
            label: 'Setup could not be completed',
            detail: 'This reconnect link is missing the account it belongs to. Start the flow again.',
          });
        }

        const result = await this.accountsGateway.reconnect(state.accountId, signup);
        return this.returnTo(state, true, result.message);
      }

      const created = await this.accountsGateway.connectEmbedded(signup);
      return this.returnTo(state, true, created.message);
    } catch (failure) {
      // The raw error, not the message shown to the operator: a downstream problem arriving over
      // NATS is frequently neither an HttpException nor an Error, and logging only the presentable
      // sentence made every distinct failure look identical in the log
      this.logger.error(
        `Embedded Signup completion failed for org ${state.orgId}: ${this.describe(failure)}`,
        failure instanceof Error ? failure.stack : undefined,
      );

      return this.returnTo(state, false, this.failureMessage(failure));
    }
  }

  // The console's own address with the outcome attached. Built from the URL that was signed into the
  // state, so it cannot have been redirected elsewhere in the meantime.
  private returnTo(state: EmbeddedSignupState, ok: boolean, message: string): string {
    const url = new URL(state.returnUrl);
    url.searchParams.set(RESULT_PARAM, ok ? 'connected' : 'failed');
    url.searchParams.set(MESSAGE_PARAM, message.slice(0, MAX_MESSAGE_LENGTH));

    return url.toString();
  }

  // The sentence to show the operator
  private failureMessage(error: unknown): string {
    const problem = this.problemOf(error);
    if (typeof problem === 'string') return problem;

    return problem?.detail ?? problem?.label ?? problem?.title ?? problem?.message ?? GENERIC_FAILURE;
  }

  private problemOf(
    error: unknown,
  ): string | { detail?: string; label?: string; title?: string; message?: string } | undefined {
    if (error instanceof HttpException) {
      const body = error.getResponse();
      if (typeof body === 'string') return body;
      return body && typeof body === 'object' ? body : undefined;
    }

    // A leaked problem object from NATS. Deliberately excludes Error instances, whose `message` is
    // diagnostic rather than presentable.
    if (error && typeof error === 'object' && !(error instanceof Error)) {
      return error as { detail?: string; label?: string; title?: string };
    }

    return undefined;
  }

  // Everything known about a failure, for the log only
  private describe(error: unknown): string {
    if (error instanceof HttpException) return `${error.name}: ${JSON.stringify(error.getResponse())}`;
    if (error instanceof Error) return `${error.name}: ${error.message}`;

    try {
      return `non-error thrown: ${JSON.stringify(error)}`;
    } catch {
      return `non-error thrown: ${String(error)}`;
    }
  }
}
