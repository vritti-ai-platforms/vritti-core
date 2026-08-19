import type { Workspace, WorkspaceOption } from '../workspaces/types';
import { getSdk, type PayloadLike, type ShopperLike } from './runtime';

/** What the caller should do once the store has been settled. */
export type StoreResolution = { outcome: 'selected' } | { outcome: 'choose'; sites: WorkspaceOption[] };

/**
 * The Payload session id this request is authenticated with.
 *
 * `_sid` is Payload's own session identifier — set from the JWT in its jwt strategy and used for
 * session revocation. It is underscore-prefixed and absent from the generated types, hence the cast;
 * it is stable because Payload's own revocation depends on it.
 */
function sessionId(customer: ShopperLike): string | null {
  return (customer as { _sid?: string })._sid ?? null;
}

/** The store this session is browsing, or null when nothing has been chosen yet. */
export async function currentWorkspace(args: {
  payload: PayloadLike;
  customer: ShopperLike;
}): Promise<Workspace | null> {
  const sid = sessionId(args.customer);
  if (!sid) return null;

  const { docs } = await args.payload.find({
    collection: 'customer-sessions',
    where: { sid: { equals: sid } },
    limit: 1,
    depth: 0,
  });

  const row = docs[0] as
    | { id: string; workspaceKind: string; workspaceId?: string | null; expiresAt: string }
    | undefined;
  if (!row) return null;

  // Swept here because nothing else can: Payload gives no signal when a session lapses, so a stale
  // row would otherwise keep scoping requests for a session that is gone.
  if (new Date(row.expiresAt) < new Date()) {
    await args.payload.delete({ collection: 'customer-sessions', id: row.id }).catch(() => undefined);
    return null;
  }

  if (row.workspaceKind === 'org') return { kind: 'org' };
  return row.workspaceId ? ({ kind: row.workspaceKind, id: row.workspaceId } as Workspace) : null;
}

/**
 * Records which store the shopper is browsing, for this session only.
 *
 * Upserted against the session id, so choosing again replaces the choice rather than accumulating
 * rows — and a second device keeps its own.
 *
 * Deliberately does **not** validate the id against the organization's real stores. Core does not
 * either, by design: the tenant comes from the app credential and row-level security confines
 * everything to it, so a wrong id narrows a request to nothing rather than reaching another
 * organization's data. What that does mean is that callers should pass an id they got from core's own
 * list, not one a visitor supplied.
 */
export async function selectWorkspace(args: {
  payload: PayloadLike;
  customer: ShopperLike;
  workspace: Workspace;
}): Promise<{ error?: string }> {
  const { payload, customer, workspace } = args;
  const sid = sessionId(customer);
  if (!sid) return { error: 'Sign in to choose a store.' };

  // The row lives exactly as long as the session it belongs to.
  const sessions = (customer as { sessions?: { id: string; expiresAt: string }[] }).sessions ?? [];
  const expiresAt = sessions.find((session) => session.id === sid)?.expiresAt;

  if (!expiresAt) {
    // Authenticated but not in the customer's session list, which should be impossible — Payload's
    // jwt strategy checks exactly that before setting `_sid`.
    return { error: 'Your session has expired. Sign in again.' };
  }

  const data = {
    sid,
    customer: customer.id,
    workspaceKind: workspace.kind,
    workspaceId: workspace.kind === 'org' ? null : workspace.id,
    expiresAt,
  };

  const { docs } = await payload.find({
    collection: 'customer-sessions',
    where: { sid: { equals: sid } },
    limit: 1,
    depth: 0,
  });

  const existing = docs[0] as { id: string } | undefined;
  if (existing) await payload.update({ collection: 'customer-sessions', id: existing.id, data });
  else await payload.create({ collection: 'customer-sessions', data });

  return {};
}

/**
 * Drops this session's store choice.
 *
 * Call it from the logout path **before** the cookie is cleared, because that is the last moment the
 * session still resolves — Payload's `afterLogout` hook receives only `{ collection, context, req }`,
 * with no user and no session id, so it cannot do this itself.
 */
export async function clearWorkspace(args: { payload: PayloadLike; customer: ShopperLike }): Promise<void> {
  const sid = sessionId(args.customer);
  if (!sid) return;

  await args.payload
    .delete({ collection: 'customer-sessions', where: { sid: { equals: sid } } })
    .catch(() => undefined);
}

/**
 * Settles which store this session is browsing.
 *
 * Sites are the only thing a shopper picks. Legal entities and site groups are staff-facing
 * groupings — a shopper has no way to reason about them — so they are never offered, and an
 * organization with no sites falls back to org scope, which core expresses as sending no workspace
 * header at all.
 *
 * **Call this from a request *after* the one that signed in.** A login sets the session cookie on the
 * response, while `_sid` is read from the JWT on an incoming request, so inside the login handler
 * there is no session yet to attach a store to and this would find no `sid`.
 *
 * **Never throws.** A shopper must be able to sign in while core is down; they then browse at org
 * scope and the next sign-in resolves it properly.
 */
export async function resolveStoreForSession(args: {
  payload: PayloadLike;
  customer: ShopperLike;
}): Promise<StoreResolution> {
  const { payload, customer } = args;

  // Already chosen — including a deliberate org-scope choice, which is why this checks for a row
  // rather than for a site id.
  if (await currentWorkspace({ payload, customer })) return { outcome: 'selected' };

  try {
    const { sites } = await getSdk(payload).workspaces.list();

    const only = sites[0];
    if (sites.length === 1 && only) {
      await selectWorkspace({ payload, customer, workspace: { kind: 'site', id: only.id } });
      return { outcome: 'selected' };
    }

    if (sites.length === 0) {
      await selectWorkspace({ payload, customer, workspace: { kind: 'org' } });
      return { outcome: 'selected' };
    }

    return { outcome: 'choose', sites };
  } catch (error) {
    // Org scope is the honest fallback: it is what core does with no workspace header, so the shopper
    // browses everything the organization exposes rather than being blocked at a chooser.
    payload.logger?.error({ err: error }, 'Could not resolve the store for this session');
    return { outcome: 'selected' };
  }
}
