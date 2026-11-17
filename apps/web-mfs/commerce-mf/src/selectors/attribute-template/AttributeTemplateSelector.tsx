import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type AttributeTemplateSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'>;

export const AttributeTemplateSelector = forwardRef<HTMLButtonElement, AttributeTemplateSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Attribute Template"
    placeholder="Select attribute template"
    searchable
    optionsEndpoint="commerce-api/select-api/attribute-templates"
    fieldKeys={{
      valueKey: 'id',
      labelKey: 'name',
      descriptionKey: 'code',
      additionalKeys: 'code,description,values',
    }}
    {...props}
  />
));
AttributeTemplateSelector.displayName = 'AttributeTemplateSelector';
