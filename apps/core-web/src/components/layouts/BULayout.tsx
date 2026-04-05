import { useLayoutMode } from '@vritti/quantum-ui/context';
import { QueryErrorBoundary } from '@vritti/quantum-ui/ErrorBoundary';
import { SidebarInset, SidebarProvider } from '@vritti/quantum-ui/Sidebar';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

// BU-scoped layout — TopBar + sidebar + content area
export const BULayout = () => {
  const { mode } = useLayoutMode();

  return (
    <SidebarProvider>
      <TopBar />
      <Sidebar />
      <SidebarInset className="pt-14 h-svh overflow-hidden">
        <main className={mode === 'full'
          ? 'flex-1 overflow-hidden flex flex-col'
          : 'flex-1 overflow-auto p-4 sm:p-6'
        }>
          <div className="max-w-7xl mx-auto w-full">
            <QueryErrorBoundary>
              <Outlet />
            </QueryErrorBoundary>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
