import type { RouteObject } from 'react-router-dom';
import { FeatureWrapper } from '../../components/FeatureWrapper';
import { CategoriesPage } from './CategoriesPage';

const routes: RouteObject[] = [
  { index: true, element: <FeatureWrapper><CategoriesPage /></FeatureWrapper> },
];

export default routes;
