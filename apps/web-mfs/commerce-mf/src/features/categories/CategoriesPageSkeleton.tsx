import { CompactTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { DetailSectionSkeleton } from '@vritti/quantum-ui/DetailField';
import { PageContent, PageContentDetails, PageContentPanel, PanelSkeleton } from '@vritti/quantum-ui/PageContent';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const CategoriesPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showActions />
    <PageContent>
      <PageContentPanel header={<Skeleton className="h-9 w-full rounded-md" />} headerClassName="shrink-0">
        <PanelSkeleton />
      </PageContentPanel>

      <PageContentDetails className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-7 w-56" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
        <DetailSectionSkeleton count={3} />
        <CompactTableSkeleton
          rows={4}
          columns={[
            { headerWidth: 'w-28', cellWidth: 'w-36' },
            { headerWidth: 'w-16', cellWidth: 'w-20' },
          ]}
        />
      </PageContentDetails>
    </PageContent>
  </div>
);
