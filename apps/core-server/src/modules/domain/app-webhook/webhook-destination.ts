import { lookup as dnsLookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

// The setting that opens webhook delivery to private and local addresses, for local development
export const ALLOW_PRIVATE_DESTINATIONS_ENV = 'WEBHOOK_ALLOW_PRIVATE_DESTINATIONS';

// True when the setting is on.
export function privateDestinationsAllowed(read: (key: string) => unknown): boolean {
  const value = read(ALLOW_PRIVATE_DESTINATIONS_ENV);
  return value === true || value === 'true';
}

export type HostLookup = (hostname: string) => Promise<{ address: string; family: number }[]>;

const BLOCKED_HOST_SUFFIXES = ['.svc', '.cluster.local', '.internal', '.local', '.localhost'];

const BLOCKED_ADDRESSES = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['224.0.0.0', 4],
] as const) {
  BLOCKED_ADDRESSES.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  BLOCKED_ADDRESSES.addSubnet(network, prefix, 'ipv6');
}

// Resolves every address of a host name
export const resolveAllAddresses: HostLookup = (hostname) => dnsLookup(hostname, { all: true, verbatim: true });

// True when a host name is local by name alone — cluster service names, mDNS, localhost
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return host === 'localhost' || BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

// True when an address is private, loopback, link-local, CGNAT, ULA, multicast or unspecified, including an IPv4
// address wrapped as IPv4-mapped IPv6
export function isBlockedAddress(address: string): boolean {
  const bare = address.replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  const family = isIP(bare);
  if (family === 4) return BLOCKED_ADDRESSES.check(bare, 'ipv4');
  if (family !== 6) return true;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(bare);
  if (mapped) return BLOCKED_ADDRESSES.check(mapped[1], 'ipv4');
  const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(bare);
  if (mappedHex) {
    const high = Number.parseInt(mappedHex[1], 16);
    const low = Number.parseInt(mappedHex[2], 16);
    return BLOCKED_ADDRESSES.check(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`, 'ipv4');
  }
  return BLOCKED_ADDRESSES.check(bare, 'ipv6');
}

// Why a webhook URL must not be called, or null when its host resolves only to public addresses.
export async function findBlockedDestination(
  rawUrl: string,
  lookup: HostLookup = resolveAllAddresses,
): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return 'The URL is not valid.';
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isBlockedHostname(host)) return 'The URL points at a local or cluster-internal host name.';
  if (isIP(host) !== 0) {
    return isBlockedAddress(host) ? 'The URL points at a private or reserved address.' : null;
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(host);
  } catch {
    return 'The host name does not resolve.';
  }
  if (addresses.length === 0) return 'The host name does not resolve.';
  if (addresses.some(({ address }) => isBlockedAddress(address))) {
    return 'The host name resolves to a private or reserved address.';
  }
  return null;
}
