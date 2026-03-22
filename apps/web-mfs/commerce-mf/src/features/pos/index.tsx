import type { RouteObject } from 'react-router-dom';
import { FeatureWrapper } from '../../components/FeatureWrapper';
import { POSPage } from './POSPage';

const routes: RouteObject[] = [
  { index: true, element: <FeatureWrapper><POSPage /></FeatureWrapper> },
];

export default routes;
