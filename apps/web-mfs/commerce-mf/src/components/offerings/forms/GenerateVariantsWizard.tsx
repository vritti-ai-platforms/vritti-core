import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Checkbox } from '@vritti/quantum-ui/Checkbox';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Select } from '@vritti/quantum-ui/Select';
import { StepProgressIndicator } from '@vritti/quantum-ui/StepProgressIndicator';
import { CompactSwitch } from '@vritti/quantum-ui/Switch';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import type { OfferingData, OfferingDimensionData, VariantCombinationData } from '@/schemas/offerings';
import { SkuOrderStrip } from '../components/SkuOrderStrip';
import type { UseGenerateVariants, UsePreviewVariantCombinations } from '../types';
import { stepNumber, toStepDefs, VARIANT_WIZARD_STEPS, type VariantWizardStep } from './wizardSteps';

interface GenerateVariantsWizardProps {
  useGenerate: UseGenerateVariants;
  usePreview: UsePreviewVariantCombinations;
  offering: OfferingData;
  dimensions: OfferingDimensionData[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const GenerateVariantsWizard: React.FC<GenerateVariantsWizardProps> = ({
  useGenerate,
  usePreview,
  offering,
  dimensions,
  onSuccess,
  onCancel,
}) => {
  const steps = VARIANT_WIZARD_STEPS;
  const [step, setStep] = useState<VariantWizardStep>('values');
  const [salesUomId, setSalesUomId] = useState<string>('');
  // Every dimension and value starts selected — the common case is "generate the whole matrix".
  // Switching a dimension off drops it from this batch entirely; the variants simply will not carry it.
  const [selected, setSelected] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(dimensions.map((d) => [d.id, new Set(d.values.map((v) => v.id))])),
  );
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const generateMutation = useGenerate({ onSuccess });
  const previewMutation = usePreview();

  const activeDimensions = useMemo(
    () => dimensions.filter((dimension) => (selected[dimension.id]?.size ?? 0) > 0),
    [dimensions, selected],
  );

  const axes = useMemo(
    () =>
      activeDimensions.map((dimension) => ({
        dimensionId: dimension.id,
        valueIds: [...(selected[dimension.id] ?? [])],
      })),
    [activeDimensions, selected],
  );

  const expected = axes.reduce((total, axis) => total * axis.valueIds.length, axes.length > 0 ? 1 : 0);

  const rows: (VariantCombinationData & { key: string; excluded: boolean })[] = (
    previewMutation.data?.combinations ?? []
  ).map((combination: VariantCombinationData) => {
    const key = [...combination.valueIds].sort().join('|');
    return { ...combination, key, excluded: excluded.has(key) };
  });

  const toCreate = rows.filter((row) => !row.exists && !row.excluded);
  const canAdvance = step === 'values' ? !!salesUomId && expected > 0 : toCreate.length > 0;

  const toggleValue = (dimensionId: string, valueId: string) => {
    setSelected((current) => {
      const next = new Set(current[dimensionId]);
      next.has(valueId) ? next.delete(valueId) : next.add(valueId);
      return { ...current, [dimensionId]: next };
    });
  };

  // A dimension with nothing selected is simply not one of this batch's axes — the variants created
  // will not carry it at all, and its segment is absent from their SKUs
  const toggleDimension = (dimension: OfferingDimensionData) => {
    setSelected((current) => ({
      ...current,
      [dimension.id]:
        (current[dimension.id]?.size ?? 0) > 0 ? new Set<string>() : new Set(dimension.values.map((v) => v.id)),
    }));
  };

  const submit = () => {
    generateMutation.mutate({
      offeringId: offering.id,
      salesUomId,
      combinations: toCreate.map((row) => ({ valueIds: row.valueIds })),
    });
  };

  const goToCombinations = () => {
    previewMutation.mutate({ offeringId: offering.id, axes }, { onSuccess: () => setStep('combinations') });
  };

  const isLast = stepNumber(steps, step) === steps.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Generate Variants"
        description={`${offering.name} — additive, so combinations that already exist are skipped`}
        actions={
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        }
      />

      <StepProgressIndicator steps={toStepDefs(steps)} currentStep={stepNumber(steps, step)} />

      <Card>
        <CardContent className="flex flex-col gap-4 py-6">
          {step === 'values' && (
            <div className="flex flex-col gap-4">
              <Select
                label="Sold in"
                placeholder="Select a unit"
                value={salesUomId}
                onChange={(value: unknown) => setSalesUomId(String(value ?? ''))}
                optionsEndpoint="commerce-api/select-api/uom"
                fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
                searchable
                description="Applies to every variant in this batch."
              />

              {dimensions.map((dimension) => {
                const applies = (selected[dimension.id]?.size ?? 0) > 0;
                return (
                  <div key={dimension.id} className="flex flex-col gap-2 border-b pb-3 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CompactSwitch checked={applies} onCheckedChange={() => toggleDimension(dimension)} />
                        <span className="font-medium text-sm">{dimension.name}</span>
                      </div>
                      <span className="font-mono text-muted-foreground text-xs">
                        {applies ? `${selected[dimension.id]?.size} / ${dimension.values.length}` : 'not in this batch'}
                      </span>
                    </div>
                    {applies && (
                      <div className="flex flex-wrap gap-2">
                        {dimension.values.map((value) => (
                          <button
                            key={value.id}
                            type="button"
                            onClick={() => toggleValue(dimension.id, value.id)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                              selected[dimension.id]?.has(value.id)
                                ? 'border-primary/30 bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground opacity-60'
                            }`}
                          >
                            <Checkbox checked={selected[dimension.id]?.has(value.id) ?? false} />
                            {value.value}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {activeDimensions.length > 0 && <SkuOrderStrip offering={offering} dimensions={activeDimensions} />}

              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                {activeDimensions.map((d) => `${d.name} ${selected[d.id]?.size}`).join('  ×  ') ||
                  'No dimensions selected'}
                <span className="ml-2 font-mono font-semibold">= {expected}</span>{' '}
                <span className="text-muted-foreground">combinations</span>
              </div>
            </div>
          )}

          {step !== 'values' && (
            <div className="flex flex-col gap-3">
              <div className="max-h-80 overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/60">
                    <tr>
                      <th className="w-10 p-2" />
                      <th className="p-2 text-left font-medium">SKU</th>
                      <th className="p-2 text-left font-medium">Combination</th>
                      <th className="p-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key} className={row.exists || row.excluded ? 'opacity-50' : undefined}>
                        <td className="p-2">
                          <Checkbox
                            checked={!row.exists && !row.excluded}
                            disabled={row.exists}
                            onCheckedChange={() =>
                              setExcluded((current) => {
                                const next = new Set(current);
                                next.has(row.key) ? next.delete(row.key) : next.add(row.key);
                                return next;
                              })
                            }
                          />
                        </td>
                        <td className="p-2 font-mono text-xs">{row.sku}</td>
                        <td className="p-2 text-muted-foreground">{row.labels}</td>
                        <td className="p-2">
                          <Badge variant={row.exists ? 'success' : row.excluded ? 'secondary' : 'outline'}>
                            {row.exists ? 'exists' : row.excluded ? 'excluded' : 'new'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm">
              <span className="font-mono font-semibold text-lg">{toCreate.length}</span>{' '}
              <span className="text-muted-foreground">new {pluralize('variant', toCreate.length)} will be created</span>
              <div className="text-muted-foreground text-xs">
                {rows.filter((row) => row.exists).length} already exist · {excluded.size} excluded
              </div>
            </div>
            <div className="flex gap-2">
              {stepNumber(steps, step) > 1 ? (
                <Button
                  variant="outline"
                  startAdornment={<ArrowLeft className="size-4" />}
                  onClick={() => setStep(steps[stepNumber(steps, step) - 2].key)}
                >
                  Back
                </Button>
              ) : null}
              {isLast ? (
                <Button
                  onClick={submit}
                  isLoading={generateMutation.isPending}
                  loadingText="Generating..."
                  disabled={toCreate.length === 0}
                  startAdornment={<Sparkles className="size-4" />}
                >
                  Generate {toCreate.length}
                </Button>
              ) : (
                <Button
                  onClick={goToCombinations}
                  disabled={!canAdvance}
                  isLoading={previewMutation.isPending}
                  loadingText="Resolving..."
                  endAdornment={<ArrowRight className="size-4" />}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
