import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';
import { hashKey, QueryClient, QueryClientProvider, type QueryKey } from '@tanstack/react-query';
import { getActiveWorkspace } from '@utils/workspace';
import { ConfirmHost } from '@vritti/quantum-ui/components/ConfirmHost';
import { LayoutModeProvider } from '@vritti/quantum-ui/context';
import { QueryErrorBoundary } from '@vritti/quantum-ui/ErrorBoundary';
import { Toaster } from '@vritti/quantum-ui/Sonner';
import { ThemeProvider } from '@vritti/quantum-ui/theme';
import { BrowserRouter } from 'react-router-dom';
import { AppRender, AuthProvider } from './providers';
import { PermissionProvider } from './providers/PermissionProvider';

function workspaceQueryKeyHash(queryKey: QueryKey): string {
  const workspace = getActiveWorkspace();
  return hashKey([workspace ? `${workspace.kind}:${workspace.id}` : null, ...queryKey]);
}

// Create a single QueryClient instance to be shared across the app and microfrontends
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: workspaceQueryKeyHash,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: 'always',
      retry: 1,
      throwOnError: true,
    },
  },
});

broadcastQueryClient({ queryClient, broadcastChannel: 'vritti-core' });

const App = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <QueryErrorBoundary>
            <LayoutModeProvider>
              <AuthProvider>
                <PermissionProvider>
                  <ConfirmHost />
                  <AppRender />
                </PermissionProvider>
              </AuthProvider>
            </LayoutModeProvider>
          </QueryErrorBoundary>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
