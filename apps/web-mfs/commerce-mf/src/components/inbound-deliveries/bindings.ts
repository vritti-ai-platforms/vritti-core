import type { SelectFilterProps, SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import type { ComponentType } from 'react';
import type {
  InboundDeliveryWritePermissions,
  UseAddInboundDeliveryLines,
  UseCreateInboundDelivery,
  UseDeleteInboundDelivery,
  UseInboundDeliveriesTable,
  UseInboundDelivery,
  UseInboundDeliveryLinesTable,
  UseRemoveInboundDeliveryLine,
  UseUpdateInboundDelivery,
  UseUpdateInboundDeliveryLine,
  UseUpdateInboundDeliveryStatus,
} from './types';

export interface InboundDeliveryMutationsBinding {
  permissions: InboundDeliveryWritePermissions;
  SupplierSelector: ComponentType<DistributiveOmit<SelectProps, 'optionsEndpoint'>>;

  useCreate: UseCreateInboundDelivery;
  useUpdate: UseUpdateInboundDelivery;
  useUpdateStatus: UseUpdateInboundDeliveryStatus;
  useDelete: UseDeleteInboundDelivery;
  useAddLines: UseAddInboundDeliveryLines;
  useUpdateLine: UseUpdateInboundDeliveryLine;
  useRemoveLine: UseRemoveInboundDeliveryLine;
}

export interface InboundDeliveriesBinding {
  viewPermission: string;
  receivePermission: string;
  spansSites: boolean;
  SupplierFilter: ComponentType<DistributiveOmit<SelectFilterProps, 'optionsEndpoint' | 'name'> & { name?: string }>;

  tableKey: readonly unknown[];
  tableSlug: string;
  linesTableKey: (id: string) => readonly unknown[];
  linesTableSlug: (id: string) => string;

  useTable: UseInboundDeliveriesTable;
  useInboundDelivery: UseInboundDelivery;
  useLinesTable: UseInboundDeliveryLinesTable;

  mutations?: InboundDeliveryMutationsBinding;
}
