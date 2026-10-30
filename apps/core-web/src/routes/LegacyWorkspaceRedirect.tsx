import { Navigate, useLocation } from 'react-router-dom';
import { migrateLegacyWorkspacePath } from '../utils/workspace';

// Sends a pre-change bookmark (/site-name~uuid/…) to its /site/<uuid>/… URL; anything else goes to the picker
export const LegacyWorkspaceRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const target = migrateLegacyWorkspacePath(pathname);
  return <Navigate to={target ? `${target}${search}${hash}` : '/'} replace />;
};
