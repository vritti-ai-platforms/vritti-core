/**
 * Assembling a file by *deleting* from one canonical copy.
 *
 * Three optional plugins all converge on `payload.config.ts`, so the shape of
 * that file is a combination rather than a choice — eight of them for three
 * questions. Keeping eight copies is how the sibling sites ended up with three
 * configs nobody could diff; building one from fragments means the canonical
 * file exists nowhere and cannot be read, typechecked or reviewed.
 *
 * So `source/` holds exactly one config, with every optional block wrapped in a
 * marker, and scaffolding removes the markers whose feature was declined:
 *
 * ```ts
 * // #region feature:vap
 * import { vap } from '@vritti/vap-sdk/payload'
 * // #endregion feature:vap
 * ```
 *
 * Deletion beats construction for the reason deletion usually does — the input
 * is real code. The all-features-on file is what a maintainer opens, what CI
 * typechecks, and what someone reads to understand a site, and no combination
 * can contain a construct that was never written down.
 *
 * Imports are wrapped in their own markers rather than pruned afterwards, so a
 * block and the imports it needs are declared together and cannot fall out of
 * step. Two imports from one module is why `@vritti/vap-sdk/payload` appears
 * more than once in the canonical file: `vap` and `vrittiCloudAuth` are
 * independent answers, so they cannot share an import statement.
 */

const START = /^[ \t]*\/\/ #region ([A-Za-z0-9_:.-]+)[ \t]*$/;
const END = /^[ \t]*\/\/ #endregion ([A-Za-z0-9_:.-]+)[ \t]*$/;

export interface RegionResult {
  content: string;
  /** Every marker name the file declared, for the caller to check against the features it knows. */
  seen: Set<string>;
}

/**
 * Drops the regions not in `keep`, and unwraps the ones that are.
 *
 * Throws on a marker that is never closed, closed out of order, or nested.
 * Those are authoring mistakes in `source/`, and a generator that quietly
 * emitted a half-deleted config would produce a site whose failure appears
 * somewhere else entirely.
 */
export function applyRegions(content: string, keep: ReadonlySet<string>): RegionResult {
  const lines = content.split('\n');
  const output: string[] = [];
  const seen = new Set<string>();

  let open: string | null = null;
  let keeping = true;

  for (const [index, line] of lines.entries()) {
    const start = START.exec(line);
    if (start) {
      const name = start[1] as string;
      if (open) {
        throw new Error(`nested #region ${name} inside ${open} at line ${index + 1}`);
      }
      open = name;
      seen.add(name);
      keeping = keep.has(name);
      continue;
    }

    const end = END.exec(line);
    if (end) {
      const name = end[1] as string;
      if (open !== name) {
        throw new Error(
          open
            ? `#endregion ${name} closes ${open} at line ${index + 1}`
            : `#endregion ${name} with no open region at line ${index + 1}`,
        );
      }
      open = null;
      keeping = true;
      continue;
    }

    if (keeping) output.push(line);
  }

  if (open) throw new Error(`#region ${open} is never closed`);

  return { content: collapseBlankRuns(output).join('\n'), seen };
}

/**
 * Squeezes the gaps a removed region leaves behind.
 *
 * Cosmetic, and worth doing here rather than by running a formatter over the
 * output: the emitted file is the first thing anybody reads in a new repo, and
 * three blank lines where a plugin used to be reads as damage.
 */
function collapseBlankRuns(lines: string[]): string[] {
  const out: string[] = [];
  let blanks = 0;
  for (const line of lines) {
    if (line.trim() === '') {
      blanks += 1;
      if (blanks > 1) continue;
    } else {
      blanks = 0;
    }
    out.push(line);
  }
  return out;
}

/** True when any marker survived — the guard that stops a broken file being written. */
export function hasMarkers(content: string): boolean {
  return content.split('\n').some((line) => START.test(line) || END.test(line));
}
