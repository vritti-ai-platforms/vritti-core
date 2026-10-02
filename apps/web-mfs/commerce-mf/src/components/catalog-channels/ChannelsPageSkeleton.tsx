import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import type React from 'react';

// Mirrors one ChannelCard: head, the default assignment slot, then the grid head and target cards
const ChannelCardSkeleton: React.FC<{ targets?: number }> = ({ targets }) => (
  <div className="overflow-hidden rounded-xl border bg-card">
    <div className="flex items-baseline gap-3 px-6 pt-5 pb-4">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-4 w-64" />
    </div>

    <div className="flex items-center gap-4 border-t px-6 py-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>

    {targets ? (
      <>
        <div className="flex items-center gap-3 border-t bg-muted px-6 py-2.5">
          <Skeleton className="h-3 w-20" />
          <span className="flex-1" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-3 px-6 py-5">
          {Array.from({ length: targets }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder list
            <div key={index} className="flex min-h-32 flex-col gap-1.5 rounded-lg border p-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
              <div className="mt-auto flex gap-2 pt-2">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </>
    ) : (
      <div className="border-t bg-muted px-6 py-4">
        <Skeleton className="h-4 w-96" />
      </div>
    )}
  </div>
);

/**
 * The channel types are fixed — App, POS, B2B — so the skeleton shows exactly three cards rather
 * than a generic placeholder. B2B never has a grid, which is why the last one carries only a note.
 */
export const ChannelsPageSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription />

    <div className="flex flex-wrap items-center gap-4">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>

    <div className="flex flex-col gap-4">
      <ChannelCardSkeleton targets={4} />
      <ChannelCardSkeleton targets={3} />
      <ChannelCardSkeleton />
    </div>
  </div>
);
