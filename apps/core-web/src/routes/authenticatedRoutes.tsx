import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '../components/layouts/AppLayout';
import { SiteLayout } from '../components/layouts/SiteLayout';
import { ProfilePage } from '../pages/account/profile/ProfilePage';
import { SecurityPage } from '../pages/account/security/SecurityPage';
import { SiteSelectionPage } from '../pages/SiteSelectionPage';
import { DynamicFeatureRoutes } from '../utils/DynamicFeatureRoutes';

// Routes available when the user IS authenticated
export const authenticatedRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <SiteSelectionPage />,
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
    path: ':workspaceSlug/*',
    element: <SiteLayout />,
    children: [
      {
        path: '*',
        element: <DynamicFeatureRoutes />,
      },
    ],
  },
];
