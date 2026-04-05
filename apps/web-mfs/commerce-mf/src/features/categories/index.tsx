import type { RouteObject } from 'react-router-dom';
import { CategoriesPage } from './CategoriesPage';

const routes: RouteObject[] = [
  { index: true, element: <CategoriesPage /> },
];

export default routes;
