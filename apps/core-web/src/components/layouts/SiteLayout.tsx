import { useLayoutMode } from '@vritti/quantum-ui/context';
import { QueryErrorBoundary } from '@vritti/quantum-ui/ErrorBoundary';
import { SidebarInset, SidebarProvider } from '@vritti/quantum-ui/Sidebar';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

// Site-scoped layout — TopBar + sidebar + content area
export const SiteLayout = () => {
  const { mode } = useLayoutMode();

  return (
    <SidebarProvider>
      <TopBar />
      <Sidebar />
      <SidebarInset className="pt-14 h-svh overflow-hidden">
        <main className={mode === 'full' ? 'flex-1 overflow-hidden flex flex-col' : 'flex-1 overflow-auto p-4 sm:p-6'}>
          <div
            className={
              mode === 'full'
                ? 'flex-1 min-h-0 flex flex-col w-full'
                : 'max-w-7xl mx-auto w-full flex min-h-full flex-col [&>*]:min-h-0 [&>*]:flex-1'
            }
          >
            <QueryErrorBoundary>
              <Outlet />
            </QueryErrorBoundary>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
