import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '../components/layouts/AppLayout';
import { BULayout } from '../components/layouts/BULayout';
import { ProfilePage } from '../pages/account/profile/ProfilePage';
import { SecurityPage } from '../pages/account/security/SecurityPage';
import { BUSelectionPage } from '../pages/BUSelectionPage';
import { DynamicFeatureRoutes } from '../utils/DynamicFeatureRoutes';

// Routes available when the user IS authenticated
export const authenticatedRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <BUSelectionPage />,
      },
      {
        path: 'account/profile',
        element: <ProfilePage />,
      },
      {
        path: 'account/security',
        element: <SecurityPage />,
      },
    ],
  },
  {
    path: ':buSlug/*',
    element: <BULayout />,
    children: [
      {
        path: '*',
        element: <DynamicFeatureRoutes />,
      },
    ],
  },
];
