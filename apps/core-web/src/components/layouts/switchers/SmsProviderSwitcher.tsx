import { Button } from '@vritti/quantum-ui/Button';
import { Select } from '@vritti/quantum-ui/Select';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ChevronsUpDown, MessageSquareText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SmsProviderSwitcherProps {
  // The raw `name~uuid` breadcrumb segment; the id addresses the API, the slug is the fallback label
  segment: string;
  // The providers root, e.g. `/<workspaceSlug>/sms-providers`
  basePath: string;
}

const idOf = (segment: string) => segment.slice(segment.indexOf('~') + 1);
const labelOf = (segment: string) => segment.slice(0, Math.max(segment.indexOf('~'), 0)) || segment;

// Renders the SMS provider switcher dropdown in the top bar breadcrumb. The options are the org's
// own rows plus Vritti's platform senders — the same set the table shows.
export const SmsProviderSwitcher = ({ segment, basePath }: SmsProviderSwitcherProps) => {
  const navigate = useNavigate();
  const current = idOf(segment);

  return (
    <Select
      value={current}
      searchable
      optionsEndpoint="communications-api/select-api/sms-providers"
      fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
      // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
      label={undefined}
      searchPlaceholder="Find provider..."
      contentClassName="w-60"
      anchor={({ selectedOption }) => (
        <Button
          startAdornment={<MessageSquareText className="size-4 text-muted-foreground" />}
          variant="ghost"
          className="h-auto min-w-25 gap-1.5 p-0 text-sm font-normal hover:bg-transparent"
        >
          <span className="flex-1 text-left font-normal text-foreground">
            {selectedOption?.label ?? labelOf(segment)}
          </span>
          <span className="flex size-6 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent">
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </span>
        </Button>
      )}
      footer={
        <>
          <Separator />
          <div className="p-1">
            <Button
              variant="ghost"
              className="h-auto w-full justify-start px-2 py-1.5 text-sm font-normal"
              onClick={() => navigate(basePath)}
            >
              All SMS Providers
            </Button>
          </div>
        </>
      }
      onOptionSelect={(option) => {
        // Skip the on-mount initial-resolve fire (same provider) — only navigate on a real switch
        if (option && String(option.value) !== current) {
          // Lands on the provider root rather than the current tab: Templates is meaningful only for
          // MSG91, so carrying it over would strand anyone switching to a console or Twilio row
          navigate(`${basePath}/${buildSlug(String(option.label), String(option.value))}`);
        }
      }}
    />
  );
};
