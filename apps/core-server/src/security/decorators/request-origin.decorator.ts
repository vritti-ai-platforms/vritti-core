import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '@/utils/request-context';

// The origin the caller reached core on, e.g. `https://api.acme.vrittiai.com` — the edge's forwarded protocol and host
// when present, else the request's own. Unchecked: whoever calls core controls these headers, so anything built from
// this must be validated before it is handed to a third party
export const RequestOrigin = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const request = getRequest(ctx);
  const proto = firstHeader(request.headers['x-forwarded-proto']) ?? request.protocol;
  const host = firstHeader(request.headers['x-forwarded-host']) ?? firstHeader(request.headers.host);
  return proto && host ? `${proto}://${host}` : undefined;
});

// A header's first value — a proxy chain may send a list, the client-facing hop first
function firstHeader(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const first = raw?.split(',')[0]?.trim();
  return first ? first : undefined;
}
