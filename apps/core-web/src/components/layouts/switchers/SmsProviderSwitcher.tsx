import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmsProviderSelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface SmsProviderSwitcherProps {
  // The raw `name~uuid` breadcrumb segment; the id addresses the API, the slug is the fallback label
  segment: string;
  // The providers root, e.g. `/<kind>/<id>/sms-providers`
  basePath: string;
}

const idOf = (segment: string) => segment.slice(segment.indexOf('~') + 1);
const labelOf = (segment: string) => segment.slice(0, Math.max(segment.indexOf('~'), 0)) || segment;

// Renders the SMS provider switcher dropdown in the top bar breadcrumb. The options are the org's
// own rows plus Vritti's platform senders — the same set the table shows.
export const SmsProviderSwitcher = ({ segment, basePath }: SmsProviderSwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(labelOf(segment));
  const current = idOf(segment);

  return (
    <SwitcherCrumb icon={MessageSquareText} label={label} to={`${basePath}/${segment}`}>
      <SmsProviderSelector
        value={current}
        // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
        label={undefined}
        searchPlaceholder="Find provider..."
        contentClassName="w-60"
        anchor={() => <SwitcherTrigger label="Switch SMS provider" />}
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
          if (!option) return;
          // The on-mount initial-resolve fire is the current SMS provider: it names the crumb; any other is a real switch
          if (String(option.value) === current) {
            setLabel(String(option.label));
            return;
          }
          // Lands on the provider root rather than the current tab: Templates is meaningful only for
          // MSG91, so carrying it over would strand anyone switching to a console or Twilio row
          navigate(`${basePath}/${buildSlug(String(option.label), String(option.value))}`);
        }}
      />
    </SwitcherCrumb>
  );
};
