import type { RouteObject } from 'react-router-dom';
import { FeatureWrapper } from '../../components/FeatureWrapper';
import { KOTPage } from './KOTPage';

const routes: RouteObject[] = [
  { index: true, element: <FeatureWrapper><KOTPage /></FeatureWrapper> },
];

export default routes;
