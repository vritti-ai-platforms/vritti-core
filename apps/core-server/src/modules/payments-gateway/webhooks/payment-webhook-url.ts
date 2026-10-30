// The public URL a gateway delivers a config's webhooks to — the same path cloud-web shows and the webhook route serves
export function paymentWebhookUrl(origin: string, orgId: string, gatewayCode: string, configId: string): string {
  return `${origin}/payments/webhooks/${orgId}/${encodeURIComponent(gatewayCode)}/${configId}`;
}

// The caller's origin when a gateway on the internet can reach it and it is provably ours: https, no port (a local
// `https://local.vrittiai.com:3001` is only reachable from the developer's own machine), and a host under the parent of
// the deployment's cookie domain — so a spoofed Host header can never send a payment's webhooks to someone else's
// server. Null otherwise, and the order then goes out with no webhook URL of its own
export function publicWebhookOrigin(candidate: string | undefined, baseDomain: string | undefined): string | null {
  if (!candidate || !baseDomain) return null;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.port !== '' || url.pathname !== '/' || url.username || url.password) return null;

  const host = url.hostname.toLowerCase();
  const parent = parentDomain(baseDomain.toLowerCase().replace(/^\.+/, ''));
  return host === parent || host.endsWith(`.${parent}`) ? url.origin : null;
}

// `local.vrittiai.com` → `vrittiai.com`; a two-label domain is already the parent
function parentDomain(domain: string): string {
  const labels = domain.split('.').filter(Boolean);
  return labels.length > 2 ? labels.slice(1).join('.') : labels.join('.');
}
