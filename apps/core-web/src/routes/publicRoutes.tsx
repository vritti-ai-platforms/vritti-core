import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { ForgotPasswordPage } from '../pages/auth/forgot-password';
import { LoginPage } from '../pages/LoginPage';

// Public routes — shown when user is not authenticated
export const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
];
