import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@vritti/quantum-ui-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRender } from './components/AppRender';
import { AuthProvider } from './providers/AuthProvider';

const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider defaultScheme="dark">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppRender />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
