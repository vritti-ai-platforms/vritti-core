import type { RouteObject } from 'react-router-dom';
import { InvoiceDetailPage } from './InvoiceDetailPage';
import { InvoicesPage } from './InvoicesPage';

const routes: RouteObject[] = [
  { index: true, element: <InvoicesPage /> },
  { path: ':invoiceSlug', element: <InvoiceDetailPage /> },
];

export default routes;
