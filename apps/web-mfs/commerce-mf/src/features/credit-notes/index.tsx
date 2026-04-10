import type { RouteObject } from 'react-router-dom';
import { CreditNoteDetailPage } from './CreditNoteDetailPage';
import { CreditNotesPage } from './CreditNotesPage';

const routes: RouteObject[] = [
  { index: true, element: <CreditNotesPage /> },
  { path: ':cnSlug', element: <CreditNoteDetailPage /> },
];

export default routes;
