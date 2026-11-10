import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { InboundDeliveriesTable } from '@/components/inbound-deliveries/InboundDeliveriesTable';
import { binding } from './binding';

export const InboundDeliveriesPage = () => (
  <div className="flex flex-col gap-6">
    <PageHeader
      title="Inbound Deliveries"
      description="Deliveries your suppliers are sending against your purchase orders"
    />
    <InboundDeliveriesTable binding={binding} />
  </div>
);
