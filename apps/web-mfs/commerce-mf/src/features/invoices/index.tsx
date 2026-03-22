import type { RouteObject } from 'react-router-dom';
import { FeatureWrapper } from '../../components/FeatureWrapper';
import { InvoiceDetailPage } from './InvoiceDetailPage';
import { InvoicesPage } from './InvoicesPage';

const routes: RouteObject[] = [
  { index: true, element: <FeatureWrapper><InvoicesPage /></FeatureWrapper> },
  { path: ':slug', element: <FeatureWrapper><InvoiceDetailPage /></FeatureWrapper> },
];

export default routes;
