import { useRoutes } from 'react-router-dom';
import { useAuth } from '../providers';
import { authenticatedRoutes, publicRoutes } from '../routes';
import { MicrofrontendSkeletonFullPage } from '../utils/MircrofrontendFullPageSkeleton';

export const AppRender: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const routes = isAuthenticated ? authenticatedRoutes : publicRoutes;
  const routeElement = useRoutes(routes);

  if (isLoading) {
    return <MicrofrontendSkeletonFullPage />;
  }

  return routeElement;
};
