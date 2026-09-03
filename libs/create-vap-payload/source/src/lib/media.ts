export interface ResolvedImage {
  url: string
  alt: string
  width?: number
  height?: number
}

/**
 * The shape an upload document arrives in, structurally.
 *
 * Not `Media` from `@/payload-types`: those types are *generated*, and a freshly
 * scaffolded repo has to compile before `pnpm generate:types` has ever run — an
 * import of them would make a fresh clone fail to typecheck before it had done
 * anything wrong. Swap this for the generated type once it exists if you want
 * the tighter check.
 */
export interface UploadLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

/**
 * Narrows an upload relationship to what an `<Image>` needs, or null.
 *
 * Returns null rather than throwing on a relationship that arrived as a bare id
 * — the query's depth was too shallow — or on a document with no file: a
 * missing picture should render nothing, never take the page down.
 */
export function toImage(value: UploadLike | number | null | undefined): ResolvedImage | null {
  if (!value || typeof value !== 'object') return null
  if (!value.url) return null
  return {
    url: value.url,
    alt: value.alt ?? '',
    width: value.width ?? undefined,
    height: value.height ?? undefined,
  }
}
