import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layouts/AppLayout';
import { RemoteRoutes } from '../utils/RemoteRoutes';

// Routes available when the user IS authenticated
export const authenticatedRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: 'account/*',
        element: <RemoteRoutes remoteName="VrittiAuth" moduleName="routes" dataKey="accountRoutes" />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/account/profile" replace />,
  },
];
