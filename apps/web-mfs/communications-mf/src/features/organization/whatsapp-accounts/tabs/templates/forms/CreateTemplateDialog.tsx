import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup, type RadioOption } from '@vritti/quantum-ui/RadioGroup';
import { Select, type SelectOption, type SelectValue } from '@vritti/quantum-ui/Select';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useCreateWhatsappTemplate,
  useWhatsappTemplateLanguages,
  useWhatsappTemplateLibrary,
} from '@/hooks/organization/whatsapp-accounts';
import {
  type CustomTemplateFormData,
  customTemplateSchema,
  type LibraryConfigFormData,
  libraryConfigSchema,
  type TemplateLibraryItemData,
  type WhatsappTemplateCategory,
} from '@/schemas/whatsapp-templates';
import { TemplatePreview } from '../components/TemplatePreview';
import {
  buildCustomComponents,
  buildLibraryButtonInputs,
  countTemplateVariables,
  customPreviewButtons,
  libraryItemNeedsUrl,
  libraryPreviewButtons,
  substituteVariables,
} from '../utils/template-components';

interface CreateTemplateDialogProps {
  accountId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type WizardStep = 'basics' | 'library' | 'library-config' | 'custom';
type TemplateSource = 'library' | 'custom';

const CATEGORY_OPTIONS: { value: WhatsappTemplateCategory; label: string; description: string }[] = [
  { value: 'UTILITY', label: 'Utility', description: 'Transactional updates' },
  { value: 'MARKETING', label: 'Marketing', description: 'Promotions and offers' },
  { value: 'AUTHENTICATION', label: 'Authentication', description: 'One-time passcodes' },
];

// Debounced mirror of the search box so the library query is not fired per keystroke
function useDebounced(value: string, delayMs = 400): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export const CreateTemplateDialog = ({ accountId, onSuccess, onCancel }: CreateTemplateDialogProps) => {
  const [step, setStep] = useState<WizardStep>('basics');
  const [category, setCategory] = useState<WhatsappTemplateCategory>('UTILITY');
  const [language, setLanguage] = useState('en');
  const [source, setSource] = useState<TemplateSource>('library');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TemplateLibraryItemData | null>(null);
  const debouncedSearch = useDebounced(search);

  const { data: languages, isLoading: isLanguagesLoading } = useWhatsappTemplateLanguages(accountId);

  const languageOptions = useMemo<SelectOption[]>(
    () => (languages?.length ? languages : ['en']).map((code) => ({ value: code, label: code })),
    [languages],
  );

  const { data: libraryItems, isLoading: isLibraryLoading } = useWhatsappTemplateLibrary(
    accountId,
    { search: debouncedSearch || undefined, language, category },
    { enabled: step === 'library' },
  );

  const createMutation = useCreateWhatsappTemplate({ onSuccess });

  const customForm = useForm<CustomTemplateFormData>({
    resolver: zodResolver(customTemplateSchema),
    defaultValues: {
      name: '',
      headerText: '',
      body: '',
      footerText: '',
      exampleValues: [],
      quickReplies: ['', '', ''],
      urlButtonText: '',
      urlButtonUrl: '',
    },
  });

  const libraryForm = useForm<LibraryConfigFormData>({
    resolver: zodResolver(libraryConfigSchema),
    defaultValues: { name: '', websiteUrl: '' },
  });

  const customValues = customForm.watch();
  const variableCount = countTemplateVariables(customValues.body ?? '');

  // Meta writes authentication copy itself, so that category has no custom path
  const selectCategory = (value: WhatsappTemplateCategory) => {
    setCategory(value);
    if (value === 'AUTHENTICATION') setSource('library');
  };

  const selectLibraryItem = (item: TemplateLibraryItemData) => {
    setSelected(item);
    libraryForm.reset({ name: item.name, websiteUrl: '' });
    setStep('library-config');
  };

  const sourceOptions: RadioOption[] = [
    { value: 'library', label: 'Start from a template', description: "Meta's pre-approved library — no review wait" },
    ...(category !== 'AUTHENTICATION'
      ? [{ value: 'custom', label: 'Build custom', description: 'Your own content — goes through Meta review' }]
      : []),
  ];

  if (step === 'basics') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 py-4">
          <RadioGroup
            label="Category"
            variant="card"
            orientation="horizontal"
            options={CATEGORY_OPTIONS}
            value={category}
            onValueChange={(value) => selectCategory(value as WhatsappTemplateCategory)}
          />

          <Select
            label="Language"
            placeholder={isLanguagesLoading ? 'Loading languages…' : 'Select language'}
            searchable
            options={languageOptions}
            value={language}
            onChange={(value: SelectValue) => {
              if (value) setLanguage(String(value));
            }}
            disabled={isLanguagesLoading}
          />

          <RadioGroup
            label="How do you want to start?"
            variant="card"
            orientation="horizontal"
            options={sourceOptions}
            value={source}
            onValueChange={(value) => setSource(value as TemplateSource)}
          />
          {category === 'AUTHENTICATION' && (
            <Typography variant="body2" intent="muted">
              Authentication copy is written by Meta, so these templates always start from the library.
            </Typography>
          )}
        </div>
        <DialogActions>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={() => setStep(source === 'library' ? 'library' : 'custom')}>
            Next
          </Button>
        </DialogActions>
      </div>
    );
  }

  if (step === 'library') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
          <div className="flex items-center gap-2">
            <input
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Search templates — e.g. order, delivery, appointment…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Badge variant="outline">{category.toLowerCase()}</Badge>
            <Badge variant="outline">{language}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {isLibraryLoading ? (
              <>
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </>
            ) : !libraryItems?.length ? (
              <Typography variant="body2" intent="muted" className="col-span-full py-8 text-center">
                No library templates match this category, language, and search.
              </Typography>
            ) : (
              libraryItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex flex-col gap-2 rounded-lg border-2 border-border p-3 text-left transition-all hover:border-primary"
                  onClick={() => selectLibraryItem(item)}
                >
                  <span className="truncate font-medium font-mono text-sm">{item.name}</span>
                  <TemplatePreview
                    header={item.header}
                    body={substituteVariables(item.body ?? '', item.bodyParams)}
                    buttons={libraryPreviewButtons(item)}
                  />
                </button>
              ))
            )}
          </div>
        </div>
        <DialogActions>
          <Button
            type="button"
            variant="outline"
            startAdornment={<ChevronLeft className="size-4" />}
            onClick={() => setStep('basics')}
          >
            Back
          </Button>
        </DialogActions>
      </div>
    );
  }

  if (step === 'library-config' && selected) {
    return (
      <Form
        form={libraryForm}
        mutation={createMutation}
        transformSubmit={(data: LibraryConfigFormData) => ({
          accountId,
          data: {
            name: data.name,
            language,
            category: (selected.category as WhatsappTemplateCategory) ?? category,
            libraryTemplateName: selected.name,
            libraryTemplateButtonInputs: buildLibraryButtonInputs(selected, data.websiteUrl),
          },
        })}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <TemplatePreview
              header={selected.header}
              body={substituteVariables(selected.body ?? '', selected.bodyParams)}
              buttons={libraryPreviewButtons(selected)}
            />
          </div>
          <TextField name="name" label="Template name" description="Must be unique on this account" />
          {libraryItemNeedsUrl(selected) && (
            <TextField
              name="websiteUrl"
              label="Website URL"
              placeholder="https://example.com"
              description="This library template has a website button — it will point here"
            />
          )}
        </div>
        <DialogActions>
          <Button
            type="button"
            variant="outline"
            startAdornment={<ChevronLeft className="size-4" />}
            onClick={() => setStep('library')}
          >
            Back
          </Button>
          <Button type="submit" loadingText="Creating...">
            Create template
          </Button>
        </DialogActions>
      </Form>
    );
  }

  return (
    <Form
      form={customForm}
      mutation={createMutation}
      transformSubmit={(data: CustomTemplateFormData) => ({
        accountId,
        data: {
          name: data.name,
          language,
          category,
          components: buildCustomComponents(data),
        },
      })}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{category.toLowerCase()}</Badge>
            <Badge variant="outline">{language}</Badge>
          </div>
          <TextField
            name="name"
            label="Name"
            placeholder="order_update"
            description="lowercase_snake_case, immutable later"
          />
          <TextField name="headerText" label="Header (optional)" placeholder="Order update" />
          <TextArea
            name="body"
            label="Body"
            rows={4}
            placeholder={'Hi {{1}}, your order {{2}} has shipped.'}
            description="Use {{1}}, {{2}}… for variables"
          />
          {Array.from({ length: variableCount }, (_, i) => (
            <TextField
              // biome-ignore lint/suspicious/noArrayIndexKey: the index IS the variable number
              key={i}
              name={`exampleValues.${i}`}
              label={`Example value for {{${i + 1}}}`}
              description={i === 0 ? 'Meta reviews the rendered example, so every variable needs one' : undefined}
            />
          ))}
          <TextField name="footerText" label="Footer (optional)" placeholder="Reply STOP to opt out" />
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField name="quickReplies.0" label="Quick reply 1" />
            <TextField name="quickReplies.1" label="Quick reply 2" />
            <TextField name="quickReplies.2" label="Quick reply 3" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField name="urlButtonText" label="URL button label" placeholder="Track order" />
            <TextField name="urlButtonUrl" label="URL button link" placeholder="https://…" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 lg:w-72">
          <Typography variant="body2" intent="muted">
            Preview
          </Typography>
          <TemplatePreview
            header={customValues.headerText}
            body={substituteVariables(customValues.body ?? '', customValues.exampleValues ?? [])}
            footer={customValues.footerText}
            buttons={customPreviewButtons(customValues)}
          />
        </div>
      </div>
      <DialogActions>
        <Button
          type="button"
          variant="outline"
          startAdornment={<ChevronLeft className="size-4" />}
          onClick={() => setStep('basics')}
        >
          Back
        </Button>
        <Button type="submit" loadingText="Submitting...">
          Submit for review
        </Button>
      </DialogActions>
    </Form>
  );
};
