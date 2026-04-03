import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '../components/layouts/AppLayout';
import { ProfilePage } from '../pages/account/profile/ProfilePage';
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
        path: ':buSlug/*',
        element: <DynamicFeatureRoutes />,
      },
    ],
  },
];
