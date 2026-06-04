import type { RouteObject } from 'react-router-dom';
import { PosBillingPage } from './PosBillingPage';
import { PosTerminalsPage } from './PosTerminalsPage';

const routes: RouteObject[] = [
  { index: true, element: <PosTerminalsPage /> },
  { path: ':terminalSlug', element: <PosBillingPage /> },
];

export default routes;
