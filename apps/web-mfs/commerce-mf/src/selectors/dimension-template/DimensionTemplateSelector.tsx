import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type DimensionTemplateSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'>;

export const DimensionTemplateSelector = forwardRef<HTMLButtonElement, DimensionTemplateSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Dimension Template"
    placeholder="Select dimension template"
    searchable
    optionsEndpoint="commerce-api/select-api/dimension-templates"
    fieldKeys={{
      valueKey: 'id',
      labelKey: 'name',
      descriptionKey: 'code',
      additionalKeys: 'code,description,values',
    }}
    {...props}
  />
));
DimensionTemplateSelector.displayName = 'DimensionTemplateSelector';
