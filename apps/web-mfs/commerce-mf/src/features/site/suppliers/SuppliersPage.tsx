import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { EnrollmentsTable } from '@/components/suppliers/EnrollmentsTable';
import { binding } from './binding';

export const SuppliersPage = () => (
  <div className="flex flex-col gap-6">
    <PageHeader title="Suppliers" description="All suppliers with their enrollment status" />
    <EnrollmentsTable binding={binding} />
  </div>
);
