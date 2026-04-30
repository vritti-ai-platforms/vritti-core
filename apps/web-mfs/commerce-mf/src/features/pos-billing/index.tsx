import type { RouteObject } from 'react-router-dom';
import { PosBillingPage } from './PosBillingPage';
import { TerminalPickerPage } from './TerminalPickerPage';

const routes: RouteObject[] = [
  { index: true, element: <TerminalPickerPage /> },
  { path: ':terminalSlug', element: <PosBillingPage /> },
];

export default routes;
