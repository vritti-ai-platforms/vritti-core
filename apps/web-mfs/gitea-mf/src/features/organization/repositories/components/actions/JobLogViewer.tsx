import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { Collapsible } from '@vritti/quantum-ui/Collapsible';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { ScrollText, X } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useJobLogs } from '@/hooks/organization/actions';
import type { JobData } from '@/schemas/actions';
import { parseJobLog } from '../../utils/actions';

// One <pre> per section, never one element per line: a long log would otherwise put tens of thousands of
// nodes in the DOM, which is exactly what would force a virtualizer back into this app.
const LOG_BLOCK = 'max-h-96 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap break-words';

interface JobLogViewerProps {
  repositoryName: string;
  job: JobData;
  onClose: () => void;
}

export const JobLogViewer: React.FC<JobLogViewerProps> = ({ repositoryName, job, onClose }) => {
  // A running job keeps appending, so its log is re-read until the job itself goes terminal
  const { data, isLoading } = useJobLogs(repositoryName, job.id, job.isActive);

  const sections = useMemo(() => parseJobLog(data?.content ?? ''), [data?.content]);

  return (
    <Card className="overflow-hidden py-0">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2">
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <ScrollText className="size-4 shrink-0" />
          <span className="truncate">Logs — {job.name}</span>
        </span>
        <Button variant="ghost" size="icon" aria-label="Close logs" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {data?.isTruncated && (
          <Alert
            variant="warning"
            title="Only the end of this log is shown"
            description="The full output was too large to send, so its earlier lines — including the runner's setup output — were dropped and the most recent output kept."
          />
        )}

        {isLoading && !data ? (
          // Mirrors LOG_BLOCK — a log section is a filled block, so there is no inner structure to stand in for
          <Skeleton className="h-64 w-full rounded-md" />
        ) : sections.length === 0 ? (
          <Empty
            icon={<ScrollText />}
            title="No output yet"
            description={
              job.isActive
                ? 'This job has not written anything yet. The view refreshes on its own while the job runs.'
                : 'This job finished without writing any log output.'
            }
          />
        ) : (
          sections.map((section) =>
            section.title === null ? (
              <pre key={section.id} className={LOG_BLOCK}>
                {section.lines.join('\n')}
              </pre>
            ) : (
              <Collapsible
                key={section.id}
                trigger={<span className="text-sm">{section.title}</span>}
                triggerClassName="w-full"
              >
                <pre className={`mt-2 ${LOG_BLOCK}`}>{section.lines.join('\n')}</pre>
              </Collapsible>
            ),
          )
        )}
      </div>
    </Card>
  );
};
