import './global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@vritti/quantum-ui-native/NativeStack';
import { StatusBar } from 'expo-status-bar';
import { DeploymentSelectionScreen } from './src/screens/DeploymentSelectionScreen';
import { EmailLookupScreen } from './src/screens/EmailLookupScreen';
import { OrgSelectionScreen } from './src/screens/OrgSelectionScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="DeploymentSelection"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="DeploymentSelection" component={DeploymentSelectionScreen} />
          <Stack.Screen name="EmailLookup" component={EmailLookupScreen} />
          <Stack.Screen name="OrgSelection" component={OrgSelectionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
