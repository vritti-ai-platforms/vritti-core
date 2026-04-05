import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@vritti/quantum-ui/theme';
import { ConfirmProvider, LayoutModeProvider } from '@vritti/quantum-ui/context';
import { Toaster } from '@vritti/quantum-ui/Sonner';
import { BrowserRouter } from 'react-router-dom';
import { AppRender, AuthProvider } from './providers';
import { PermissionProvider } from './providers/PermissionProvider';

// Create a single QueryClient instance to be shared across the app and microfrontends
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      throwOnError: true,
    },
  },
});

const App = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LayoutModeProvider>
            <AuthProvider>
              <PermissionProvider>
                <ConfirmProvider>
                  <AppRender />
                </ConfirmProvider>
              </PermissionProvider>
            </AuthProvider>
          </LayoutModeProvider>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
