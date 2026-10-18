import { isIP } from 'node:net';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { AppWebhookEndpointDto } from '../dto/entity/app-webhook-endpoint.dto';
import type { UpsertAppWebhookEndpointInternalDto } from '../dto/request/upsert-app-webhook-endpoint-internal.dto';
import { AppWebhookEndpointDomainRepository } from '../repositories/app-webhook-endpoint.repository';
import { findBlockedDestination, isBlockedHostname, privateDestinationsAllowed } from '../webhook-destination';

@Injectable()
export class AppWebhookEndpointDomainService {
  private readonly logger = new Logger(AppWebhookEndpointDomainService.name);

  constructor(
    private readonly endpointRepository: AppWebhookEndpointDomainRepository,
    private readonly config: ConfigService,
  ) {}

  // The app's endpoint, or null when it has none
  async findByApp(organizationId: string, appId: string): Promise<AppWebhookEndpointDto | null> {
    const row = await this.endpointRepository.findByApp(organizationId, appId);
    return row ? AppWebhookEndpointDto.from(row) : null;
  }

  // Registers or replaces the app's endpoint after checking the URL is https to a host that resolves only to public
  // addresses; the delivery worker checks the resolution again before every send
  async upsert(
    organizationId: string,
    appId: string,
    dto: UpsertAppWebhookEndpointInternalDto,
  ): Promise<AppWebhookEndpointDto> {
    if (privateDestinationsAllowed((key) => this.config.get(key))) {
      // Local development: a storefront on this machine is a private, often plain-http, address
      assertWebUrl(dto.url);
      this.logger.warn(`Saving webhook URL for app ${appId} without the public-address check (local development)`);
    } else {
      assertPublicHttpsUrl(dto.url);
      const blocked = await findBlockedDestination(dto.url);
      if (blocked) throw invalidUrl(blocked);
    }
    const row = await this.endpointRepository.upsert(organizationId, appId, {
      url: dto.url,
      events: dto.events,
      isActive: dto.isActive,
    });
    this.logger.log(`Saved webhook endpoint ${row.id} for app ${appId} (${row.events.length} events)`);
    return AppWebhookEndpointDto.from(row);
  }

  // Removes the app's endpoint and, by cascade, its delivery history
  async delete(organizationId: string, appId: string): Promise<void> {
    const removed = await this.endpointRepository.deleteByApp(organizationId, appId);
    if (removed === 0) {
      throw new NotFoundException({
        label: 'Webhook Endpoint Not Found',
        detail: 'This app has no webhook endpoint to remove.',
      });
    }
    this.logger.log(`Deleted webhook endpoint of app ${appId}`);
  }
}

// Rejects anything but https to a named host.
function assertPublicHttpsUrl(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw invalidUrl('Enter a valid URL.');
  }
  if (url.protocol !== 'https:') throw invalidUrl('The URL must use https.');
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (isIP(host) !== 0 || isBlockedHostname(host)) {
    throw invalidUrl('The URL must point at a public host name, not an IP address or a local name.');
  }
  if (url.username || url.password) throw invalidUrl('The URL must not carry credentials.');
}

// The local-development check: any http or https URL without credentials
function assertWebUrl(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw invalidUrl('Enter a valid URL.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw invalidUrl('The URL must use http or https.');
  if (url.username || url.password) throw invalidUrl('The URL must not carry credentials.');
}

function invalidUrl(message: string): BadRequestException {
  return new BadRequestException({
    label: 'Invalid Webhook URL',
    detail: 'Webhooks are delivered only to public https URLs.',
    errors: [{ field: 'url', message }],
  });
}
