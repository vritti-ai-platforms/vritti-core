import type { RouteObject } from 'react-router-dom';
import { FeatureWrapper } from '../../components/FeatureWrapper';
import { ProductsPage } from './ProductsPage';
import { ProductViewPage } from './ProductViewPage';

const routes: RouteObject[] = [
  { index: true, element: <FeatureWrapper><ProductsPage /></FeatureWrapper> },
  { path: ':slug', element: <FeatureWrapper><ProductViewPage /></FeatureWrapper> },
];

export default routes;
