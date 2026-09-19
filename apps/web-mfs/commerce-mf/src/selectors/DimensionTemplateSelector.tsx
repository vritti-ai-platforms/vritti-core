import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type DimensionTemplateSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

export const DimensionTemplateSelector = forwardRef<HTMLButtonElement, DimensionTemplateSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Dimension Template"
    placeholder="Select dimension template"
    searchable
    optionsEndpoint="commerce-api/select-api/dimension-templates"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
    {...props}
  />
));
DimensionTemplateSelector.displayName = 'DimensionTemplateSelector';
