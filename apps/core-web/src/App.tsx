import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfirmProvider, LayoutModeProvider } from '@vritti/quantum-ui/context';
import { QueryErrorBoundary } from '@vritti/quantum-ui/ErrorBoundary';
import { Toaster } from '@vritti/quantum-ui/Sonner';
import { ThemeProvider } from '@vritti/quantum-ui/theme';
import { BrowserRouter } from 'react-router-dom';
import { AppRender, AuthProvider } from './providers';
import { PermissionProvider } from './providers/PermissionProvider';

// Create a single QueryClient instance to be shared across the app and microfrontends
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
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
                  <ConfirmProvider>
                    <AppRender />
                  </ConfirmProvider>
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
