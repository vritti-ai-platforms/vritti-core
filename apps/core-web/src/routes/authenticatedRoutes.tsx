import type { RouteObject } from 'react-router-dom';
import { ContentLayout } from '../components/layouts/ContentLayout';
import { AppLayout } from '../components/layouts/AppLayout';
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
        path: ':buSlug/*',
        element: <DynamicFeatureRoutes />,
      },
    ],
  },
  {
    path: '/account',
    element: <ContentLayout />,
    children: [
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'security',
        element: <SecurityPage />,
      },
    ],
  },
];
