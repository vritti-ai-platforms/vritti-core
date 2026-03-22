import type { RouteObject } from 'react-router-dom';
import { FeatureWrapper } from '../../components/FeatureWrapper';
import { StationsPage } from './StationsPage';

const routes: RouteObject[] = [
  { index: true, element: <FeatureWrapper><StationsPage /></FeatureWrapper> },
];

export default routes;
