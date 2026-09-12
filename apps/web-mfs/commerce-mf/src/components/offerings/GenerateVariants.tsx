import { useSlugParams } from '@vritti/quantum-ui/hooks';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { OfferingsBinding } from './bindings';
import { GenerateVariantsWizard } from './forms/GenerateVariantsWizard';

interface GenerateVariantsProps {
  binding: OfferingsBinding;
}

// The wizard gets its own route rather than a dialog: it is a multi-step review of a matrix that can
// run to hundreds of rows, and a URL means the step survives a refresh or a share.
export const GenerateVariants: React.FC<GenerateVariantsProps> = ({ binding }) => {
  const { id } = useSlugParams('slug');
  const navigate = useNavigate();

  const { data: offering } = binding.useOffering(id);
  const { data: dimensions = [] } = binding.useDimensions(id);

  // `relative: 'path'` walks URL segments; the default walks the route tree, and this route is a flat
  // sibling of the tab route rather than nested under it
  const backToVariants = () => navigate('..', { relative: 'path' });

  return (
    <GenerateVariantsWizard
      offering={offering}
      dimensions={dimensions}
      usePreview={binding.usePreviewVariantCombinations}
      useGenerate={binding.useGenerateVariants}
      onSuccess={backToVariants}
      onCancel={backToVariants}
    />
  );
};
