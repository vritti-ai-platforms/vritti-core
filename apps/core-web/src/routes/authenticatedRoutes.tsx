import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '../components/layouts/AppLayout';
import { SiteLayout } from '../components/layouts/SiteLayout';
import { ProfilePage } from '../pages/account/profile/ProfilePage';
import { SecurityPage } from '../pages/account/security/SecurityPage';
import { WorkspaceSelectionPage } from '../pages/WorkspaceSelectionPage';
import { DynamicFeatureRoutes } from '../utils/DynamicFeatureRoutes';
import { WORKSPACE_SEGMENTS } from '../utils/workspace';
import { LegacyWorkspaceRedirect } from './LegacyWorkspaceRedirect';

// Routes available when the user IS authenticated
export const authenticatedRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <WorkspaceSelectionPage />,
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
  // One route per workspace kind — /site/<id>, /sg/<id>, /le/<id>, /org/<id> — so the word, not a slug, decides
  ...WORKSPACE_SEGMENTS.map(
    ({ segment }): RouteObject => ({
      path: `${segment}/:workspaceId/*`,
      element: <SiteLayout />,
      children: [
        {
          path: '*',
          element: <DynamicFeatureRoutes />,
        },
      ],
    }),
  ),
  {
    path: ':legacyWorkspaceSlug/*',
    element: <LegacyWorkspaceRedirect />,
  },
];
