import type { CollectionSlug, Endpoint, Field, Payload } from 'payload' with { 'resolution-mode': 'import' };
import { VapWebhookError, verifyVapSignedRequest } from '../server/webhooks.js';

export const VAP_PRODUCT_STATUS_PATH = '/vap/products/status';
export const VAP_PRODUCT_CREATE_PATH = '/vap/products';

export const PRODUCTS_SLUG = 'products' as CollectionSlug;

export interface ProductStatus {
  exists: boolean;
  metadataComplete: boolean;
}

/**
 * The fields this package reads and writes on a storefront's `products` collection.
 *
 * Exported rather than left to each storefront to declare, because the status and create endpoints query
 * them by name. A storefront that spelled one differently would not fail loudly: the lookup would simply
 * match nothing, every listing would report as having no page, and the fix would be invisible from core.
 *
 * Factories rather than constants so a storefront can pass its own label, description, picker component
 * or validator. The merge happens here, where the field's concrete type is known — spreading one of these
 * at the call site collapses Payload's discriminated field union and stops type-checking the override.
 */
export interface FieldOverrides {
  label?: string;
  admin?: Record<string, unknown>;
  validate?: unknown;
}

function merge(base: Field, overrides?: FieldOverrides): Field {
  if (!overrides) return base;
  const { admin, ...rest } = overrides;
  return {
    ...base,
    ...rest,
    admin: { ...(base as { admin?: Record<string, unknown> }).admin, ...admin },
  } as Field;
}

// The variant in core this page sells. Unique and indexed: every lookup from core arrives by this code.
export const coreVariantCodeField = (overrides?: FieldOverrides): Field =>
  merge(
    {
      name: 'coreVariantCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Core product',
      admin: { position: 'sidebar', description: 'The product in Vritti this page sells.' },
    },
    overrides,
  );

// Core's name for it. Mirrored, not authored — a sync overwrites whatever is typed here.
export const productNameField = (overrides?: FieldOverrides): Field =>
  merge(
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Set in Vritti core — the next sync overwrites whatever is typed here.' },
    },
    overrides,
  );

// Ticked when core stops selling it. The page and everything written on it stays, so putting the product
// back in core revives this page rather than starting a new one.
export const removedInCoreField = (overrides?: FieldOverrides): Field =>
  merge(
    {
      name: 'removedInCore',
      type: 'checkbox',
      defaultValue: false,
      label: 'Removed in core',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Ticked when the product was deleted in Vritti core. It leaves the storefront at once.',
      },
    },
    overrides,
  );

export const removedInCoreAtField = (overrides?: FieldOverrides): Field =>
  merge(
    {
      name: 'removedInCoreAt',
      type: 'date',
      label: 'Removed on',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, HH:mm' },
        condition: (data: { removedInCore?: boolean }) => Boolean(data?.removedInCore),
      },
    },
    overrides,
  );

// Ticked by hand when an editor has finished the page. Nothing sets it automatically: core knows when a
// product exists, and only a person knows when its copy, images and highlights are actually ready.
export const metadataCompleteField = (overrides?: FieldOverrides): Field =>
  merge(
    {
      name: 'metadataComplete',
      type: 'checkbox',
      defaultValue: false,
      label: 'Metadata complete',
      admin: {
        position: 'sidebar',
        description: 'Tick once the copy, images and highlights are done. Vritti shows this against the listing.',
      },
    },
    overrides,
  );

// Every field this package owns, in the order they read in the sidebar
export const productSyncFields = (): Field[] => [
  coreVariantCodeField(),
  productNameField(),
  removedInCoreField(),
  removedInCoreAtField(),
  metadataCompleteField(),
];

interface ProductStatusOptions {
  clientSecret: string;
}

export interface ProductToCreate {
  code: string;
  name: string;
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/**
 * Answers, for a batch of core variant codes, whether this storefront has a page for each and whether an
 * editor has marked it finished.
 *
 * A pull rather than a push: the flag belongs to whoever edits the page, and mirroring it into core would
 * mean two sources of truth and a reconciliation job to keep them honest. Core asks when it needs to show
 * the column, so what it shows is whatever the admin panel says right now.
 *
 * Signed with the app credential — the same proof the webhook route demands — because the answer tells a
 * caller which of its codes this storefront sells, which is not a public fact.
 */
export function productStatusEndpoint(options: ProductStatusOptions): Endpoint {
  return {
    path: VAP_PRODUCT_STATUS_PATH,
    method: 'post',
    handler: async (req) => {
      let body: unknown;
      try {
        body = verifyVapSignedRequest({
          rawBody: await (req.text?.() ?? Promise.resolve('')),
          headers: req.headers,
          clientSecret: options.clientSecret,
        }).body;
      } catch (error) {
        const reason = error instanceof VapWebhookError ? error.reason : 'bad_signature';
        return json(401, { error: reason });
      }

      const codes = (body as { codes?: unknown })?.codes;
      if (!Array.isArray(codes) || codes.some((code) => typeof code !== 'string')) {
        return json(400, { error: 'Pass { codes: string[] }.' });
      }
      // A page of a table, not a catalogue dump — an unbounded IN list is a slow query waiting to happen
      if (codes.length > 200) {
        return json(400, { error: 'At most 200 codes per request.' });
      }

      const statuses = await productStatuses(req.payload, codes as string[]);
      return json(200, { statuses });
    },
  };
}

// Reads the flag for each code, defaulting the ones this storefront has never heard of
export async function productStatuses(payload: Payload, codes: string[]): Promise<Record<string, ProductStatus>> {
  const statuses: Record<string, ProductStatus> = Object.fromEntries(
    codes.map((code) => [code, { exists: false, metadataComplete: false }]),
  );
  if (codes.length === 0) return statuses;

  const { docs } = await payload.find({
    collection: PRODUCTS_SLUG,
    where: { coreVariantCode: { in: codes } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });

  for (const doc of docs as Array<{ coreVariantCode?: string; metadataComplete?: boolean; removedInCore?: boolean }>) {
    if (!doc.coreVariantCode) continue;
    statuses[doc.coreVariantCode] = {
      // A page core has already been told is gone is not a page this storefront still sells
      exists: !doc.removedInCore,
      metadataComplete: doc.metadataComplete === true,
    };
  }
  return statuses;
}

/**
 * Creates a page for each code core knows about and this storefront does not.
 *
 * Driven from core rather than from here: core is where someone decides a variant should be sold, and
 * making them retype its code into a second system is how the two drift apart. What arrives is the
 * skeleton — code and name — and everything that makes it a page is written here afterwards.
 *
 * Idempotent by code. A code that already has a page is reported as skipped rather than refused, so a
 * caller that retries after a timeout does not have to know which half of its batch landed.
 */
export function productCreateEndpoint(options: ProductStatusOptions): Endpoint {
  return {
    path: VAP_PRODUCT_CREATE_PATH,
    method: 'post',
    handler: async (req) => {
      let body: unknown;
      try {
        body = verifyVapSignedRequest({
          rawBody: await (req.text?.() ?? Promise.resolve('')),
          headers: req.headers,
          clientSecret: options.clientSecret,
        }).body;
      } catch (error) {
        const reason = error instanceof VapWebhookError ? error.reason : 'bad_signature';
        return json(401, { error: reason });
      }

      const items = (body as { products?: unknown })?.products;
      if (!Array.isArray(items) || items.some((item) => typeof item?.code !== 'string')) {
        return json(400, { error: 'Pass { products: { code, name }[] }.' });
      }
      if (items.length > 200) return json(400, { error: 'At most 200 products per request.' });

      const created: string[] = [];
      const skipped: string[] = [];
      const failed: Array<{ code: string; error: string }> = [];

      for (const item of items as ProductToCreate[]) {
        try {
          const existing = await req.payload.find({
            collection: PRODUCTS_SLUG,
            where: { coreVariantCode: { equals: item.code } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          });

          if (existing.docs.length > 0) {
            const doc = existing.docs[0] as { id: string | number; removedInCore?: boolean };
            // A page core had marked gone, come back: the copy written before is still here, so it is
            // revived rather than duplicated
            if (doc.removedInCore) {
              await req.payload.update({
                collection: PRODUCTS_SLUG,
                id: doc.id,
                data: { removedInCore: false, removedInCoreAt: null },
                overrideAccess: true,
              });
              created.push(item.code);
            } else {
              skipped.push(item.code);
            }
            continue;
          }

          await req.payload.create({
            collection: PRODUCTS_SLUG,
            data: {
              coreVariantCode: item.code,
              name: item.name || item.code,
              // The code is a slug already, and a storefront URL that matches the code is one less
              // thing to reconcile when someone goes looking for a product by either
              slug: item.code,
              metadataComplete: false,
            },
            overrideAccess: true,
          });
          created.push(item.code);
        } catch (error) {
          failed.push({ code: item.code, error: (error as Error).message });
        }
      }

      return json(200, { created, skipped, failed });
    },
  };
}
