import type { RouteObject } from 'react-router-dom';
import { FeatureWrapper } from '../../components/FeatureWrapper';
import { OrderDetailPage } from './OrderDetailPage';
import { OrdersPage } from './OrdersPage';

const routes: RouteObject[] = [
  { index: true, element: <FeatureWrapper><OrdersPage /></FeatureWrapper> },
  { path: ':slug', element: <FeatureWrapper><OrderDetailPage /></FeatureWrapper> },
];

export default routes;
