import type { RouteObject } from 'react-router-dom';
import { BomDetailPage } from './BomDetailPage';
import { BomPage } from './BomPage';

const routes: RouteObject[] = [
  { index: true, element: <BomPage /> },
  { path: ':bomSlug', element: <BomDetailPage /> },
];

export default routes;
