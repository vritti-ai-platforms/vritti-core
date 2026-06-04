import type { RouteObject } from 'react-router-dom';
import { ConversionDetailPage } from './ConversionDetailPage';
import { ConversionsPage } from './ConversionsPage';

const routes: RouteObject[] = [
  { index: true, element: <ConversionsPage /> },
  { path: ':conversionSlug', element: <ConversionDetailPage /> },
];

export default routes;
