import type { RouteObject } from 'react-router-dom';
import { PosTerminalsPage } from './PosTerminalsPage';

// Billing was removed with the catalog teardown — it priced from offering_variants.price and read
// modifier groups, neither of which exist now. It returns when the price layer does.
const routes: RouteObject[] = [{ index: true, element: <PosTerminalsPage /> }];

export default routes;
