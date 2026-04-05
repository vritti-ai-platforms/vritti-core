import type { RouteObject } from 'react-router-dom';
import { ItemFormPage } from './ItemFormPage';
import { ItemsPage } from './ItemsPage';

const routes: RouteObject[] = [
  { index: true, element: <ItemsPage /> },
  { path: ':id', element: <ItemFormPage /> },
];

export default routes;
