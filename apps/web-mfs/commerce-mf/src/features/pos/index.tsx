import type { RouteObject } from 'react-router-dom';
import { PosTerminalDetailPage } from './PosTerminalDetailPage';
import { PosTerminalsPage } from './PosTerminalsPage';

const routes: RouteObject[] = [
  { index: true, element: <PosTerminalsPage /> },
  { path: ':terminalSlug', element: <PosTerminalDetailPage /> },
];

export default routes;
