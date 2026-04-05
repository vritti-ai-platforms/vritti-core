import { QueryErrorBoundary } from '@vritti/quantum-ui/ErrorBoundary';
import { SidebarProvider } from '@vritti/quantum-ui/Sidebar';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

// Generic layout for pages that only need TopBar — no sidebar
export const ContentLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex flex-col w-full">
        <TopBar />
        <main className="flex-1 overflow-auto pt-14 p-6">
          <div className="max-w-4xl mx-auto w-full">
            <QueryErrorBoundary>
              <Outlet />
            </QueryErrorBoundary>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
