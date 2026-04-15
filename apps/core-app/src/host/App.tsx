import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@vritti/quantum-ui-native';
import { BottomNavigation, type RouteConfig } from '@vritti/quantum-ui-native/BottomNavigation';
import { StatusBar } from 'react-native';
import { RemoteScreen } from './mf/RemoteScreen';

// import { createNativeStackNavigator } from '@vritti/quantum-ui-native/NativeStack';
// import { DeploymentSelectionScreen } from './src/screens/DeploymentSelectionScreen';
// import { EmailLookupScreen } from './src/screens/EmailLookupScreen';
// import { OrgSelectionScreen } from './src/screens/OrgSelectionScreen';
// import { LoginScreen } from './src/screens/LoginScreen';
// import { PermissionProvider } from './src/providers/PermissionProvider';
// import { DynamicFeatureNavigator } from './src/mf/DynamicFeatureNavigator';
// import type { RootStackParamList } from './src/types/navigation';

// const Stack = createNativeStackNavigator<RootStackParamList>();

const queryClient = new QueryClient();
const commerceRoutes: RouteConfig[] = [
  {
    name: 'Items',
    label: 'Items',
    icon: {},
    component: () => <RemoteScreen remoteName="commerce-ma" moduleName="./Items" />,
  },
  {
    name: 'Categories',
    label: 'Categories',
    icon: {},
    component: () => <RemoteScreen remoteName="commerce-ma" moduleName="./Categories" />,
  },
  {
    name: 'Modifiers',
    label: 'Modifiers',
    icon: {},
    component: () => <RemoteScreen remoteName="commerce-ma" moduleName="./Modifiers" />,
  },
];

export default function App() {
  return (
    <ThemeProvider defaultScheme="dark">
      <QueryClientProvider client={queryClient}>
        {/* <NavigationContainer> */}
        <StatusBar barStyle="light-content" />
        <BottomNavigation routes={commerceRoutes} standalone={true} />
        {/* <LoginScreen navigation={''} route={undefined} /> */}
        {/*
        <Stack.Navigator
          initialRouteName="DeploymentSelection"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="DeploymentSelection"
            component={DeploymentSelectionScreen}
          />
          <Stack.Screen name="EmailLookup" component={EmailLookupScreen} />
          <Stack.Screen name="OrgSelection" component={OrgSelectionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home">
            {() => (
              <PermissionProvider>
                <DynamicFeatureNavigator />
              </PermissionProvider>
            )}
          </Stack.Screen>
        </Stack.Navigator>
        */}
        {/* </NavigationContainer> */}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
