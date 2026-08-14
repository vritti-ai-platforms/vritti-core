import type { AxiosError } from 'axios';
import { Ban, CheckCircle2, CircleDashed, CircleDot, Clock, type LucideIcon, SkipForward, XCircle } from 'lucide-react';

// Only the Badge variants that carry a semantic token — no className colour overrides anywhere
export type ActionBadgeVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';

export interface ActionStatusTone {
  label: string;
  variant: ActionBadgeVariant;
  Icon: LucideIcon;
  // In-flight work shows a Spinner in place of the static icon
  spin: boolean;
}

const CONCLUSION_TONES: Record<string, ActionStatusTone> = {
  cancelled: { label: 'Cancelled', variant: 'secondary', Icon: Ban, spin: false },
  failure: { label: 'Failed', variant: 'destructive', Icon: XCircle, spin: false },
  skipped: { label: 'Skipped', variant: 'outline', Icon: SkipForward, spin: false },
  success: { label: 'Success', variant: 'success', Icon: CheckCircle2, spin: false },
};

const STATUS_TONES: Record<string, ActionStatusTone> = {
  completed: { label: 'Completed', variant: 'outline', Icon: CircleDot, spin: false },
  queued: { label: 'Queued', variant: 'secondary', Icon: Clock, spin: false },
  running: { label: 'Running', variant: 'warning', Icon: CircleDashed, spin: true },
  waiting: { label: 'Waiting', variant: 'outline', Icon: Clock, spin: false },
};

// Resolution order matters: once a run is completed its conclusion is the answer people read, and the
// status only carries meaning while the run is still in flight
export function resolveActionStatus(status: string, conclusion: string | null): ActionStatusTone {
  if (conclusion) {
    const byConclusion = CONCLUSION_TONES[conclusion];
    if (byConclusion) return byConclusion;
  }

  return STATUS_TONES[status] ?? { label: status || 'Unknown', variant: 'outline', Icon: CircleDashed, spin: false };
}

// Gitea reports an unstarted run, job or step as the zero time (`0001-01-01T00:00:00Z`), which would
// render as a real date. Anything that is not a usable instant comes back as absent.
export function actionTimestamp(value: string | null): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) || parsed <= 0 ? null : value;
}

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

// Elapsed time between two Gitea timestamps. A started-but-unfinished subject measures against `nowMs`,
// which is why the parameter exists rather than being read inside — it keeps this pure and testable.
export function formatActionDuration(
  startedAt: string | null,
  completedAt: string | null,
  nowMs = Date.now(),
): string | null {
  const started = actionTimestamp(startedAt);
  if (!started) return null;

  const start = Date.parse(started);
  const completed = actionTimestamp(completedAt);
  const end = completed ? Date.parse(completed) : nowMs;
  if (end < start) return null;

  const seconds = Math.round((end - start) / MS_PER_SECOND);
  if (seconds < SECONDS_PER_MINUTE) return `${seconds}s`;
  if (seconds < SECONDS_PER_HOUR) {
    return `${Math.floor(seconds / SECONDS_PER_MINUTE)}m ${seconds % SECONDS_PER_MINUTE}s`;
  }

  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return `${Math.floor(seconds / SECONDS_PER_HOUR)}h ${minutes}m`;
}

// Only a positive integer identifies a job, so a hand-edited `?job=` is ignored rather than being sent
// to the git service. Route params carry their id in a slug and are read with useSlugParams instead.
export function parseIdParam(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

const DISPATCH_HINT =
  'A workflow can only be run by hand when it declares workflow_dispatch: inside its on: block. Add that trigger to the workflow file, push it, then run it again.';

// Gitea rejects a workflow with no workflow_dispatch trigger and exposes no trigger list, so this cannot
// be predicted before trying. 409 is the only status whose detail comes from the git service itself —
// a 403 arrives as a generic 500 whose body says nothing a user can act on, so it gets the hint alone.
export function describeDispatchError(error: AxiosError | null): string {
  const status = error?.response?.status;
  if (status === 404) return 'This workflow is no longer in the repository. Reload the page and try again.';

  const detail =
    status === 409 || status === 422 ? (error?.response?.data as { detail?: string } | undefined)?.detail : undefined;

  return detail ? `${detail} ${DISPATCH_HINT}` : DISPATCH_HINT;
}

export interface JobLogSection {
  id: string;
  // Null for output that sits outside any ::group:: block
  title: string | null;
  lines: string[];
}

// Every log line is prefixed with an RFC3339-nano instant written by the runner
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})\s?/;
const GROUP_START = '::group::';
const GROUP_END = '::endgroup::';

function trimBlankEdges(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start += 1;
  while (end > start && lines[end - 1].trim() === '') end -= 1;
  return lines.slice(start, end);
}

// Turns a raw job log into renderable sections: the timestamp prefix is dropped from every line and each
// ::group::/::endgroup:: block becomes one section. Pure, so the viewer only has to render the result.
export function parseJobLog(content: string): JobLogSection[] {
  const sections: JobLogSection[] = [];
  let sectionCount = 0;
  let current: JobLogSection | null = null;

  function newSection(title: string | null): JobLogSection {
    sectionCount += 1;
    return { id: `section-${sectionCount}`, title, lines: [] };
  }

  // A section holding nothing but blank lines is an artefact of the markers, not output worth showing
  function keep(section: JobLogSection | null): void {
    if (!section) return;
    const lines = trimBlankEdges(section.lines);
    if (lines.length > 0) sections.push({ ...section, lines });
  }

  for (const raw of content.split('\n')) {
    const line = raw.replace(/\r$/, '').replace(TIMESTAMP_PATTERN, '');

    if (line.startsWith(GROUP_START)) {
      keep(current);
      current = newSection(line.slice(GROUP_START.length).trim() || 'Group');
      continue;
    }

    if (line.startsWith(GROUP_END)) {
      keep(current);
      current = null;
      continue;
    }

    if (!current) current = newSection(null);
    current.lines.push(line);
  }

  keep(current);
  return sections;
}
