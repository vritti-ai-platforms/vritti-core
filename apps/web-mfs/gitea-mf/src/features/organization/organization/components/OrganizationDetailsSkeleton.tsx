import { CardSkeleton } from '@vritti/quantum-ui/Card';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// One entry per DetailField in OrganizationDetails' grid — named rather than indexed so the keys are stable
const DETAIL_FIELDS = ['namespace', 'fullName', 'description', 'website', 'location', 'visibility'];

// Mirrors OrganizationDetails: a card header above the two-column grid of detail fields
export const OrganizationDetailsSkeleton = () => (
  <CardSkeleton>
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 px-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 px-6 sm:grid-cols-2">
        {DETAIL_FIELDS.map((field) => (
          <div key={field} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  </CardSkeleton>
);
