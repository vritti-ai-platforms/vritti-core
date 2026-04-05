import { useLayoutMode } from '@vritti/quantum-ui/context';
import { QueryErrorBoundary } from '@vritti/quantum-ui/ErrorBoundary';
import { SidebarProvider } from '@vritti/quantum-ui/Sidebar';
import { Outlet } from 'react-router-dom';
import { usePermissionContext } from '../../providers/PermissionProvider';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout = () => {
  const { selectedBuId } = usePermissionContext();
  const { mode } = useLayoutMode();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex flex-col w-full">
        <TopBar />
        <div className="flex flex-1 pt-14">
          {selectedBuId && <Sidebar />}
          <main className={mode === 'full'
            ? 'flex-1 overflow-hidden flex flex-col'
            : 'flex-1 overflow-auto p-6'
          }>
            <QueryErrorBoundary>
              <Outlet />
            </QueryErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
