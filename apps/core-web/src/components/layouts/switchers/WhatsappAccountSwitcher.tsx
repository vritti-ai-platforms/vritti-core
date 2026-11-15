import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WhatsappAccountSelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface WhatsappAccountSwitcherProps {
  // The raw detail crumb segment — WhatsApp accounts are keyed by UUID, so this is the account id
  // (the selector resolves it to the account name once options load)
  segment: string;
  // The accounts root, e.g. `/<kind>/<id>/whatsapp-accounts`
  basePath: string;
}

// Renders the WhatsApp account switcher dropdown in the top bar breadcrumb
export const WhatsappAccountSwitcher = ({ segment, basePath }: WhatsappAccountSwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(segment);

  return (
    <SwitcherCrumb icon={MessageCircle} label={label} to={`${basePath}/${segment}/overview`}>
      <WhatsappAccountSelector
        value={segment}
        // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
        label={undefined}
        searchPlaceholder="Find account..."
        contentClassName="w-60"
        anchor={() => <SwitcherTrigger label="Switch WhatsApp account" />}
        footer={
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="w-full justify-start h-auto px-2 py-1.5 text-sm font-normal"
                onClick={() => navigate(basePath)}
              >
                All WhatsApp Accounts
              </Button>
            </div>
          </>
        }
        onOptionSelect={(option) => {
          if (!option) return;
          // The on-mount initial-resolve fire is the current WhatsApp account: it names the crumb; any other is a real switch
          if (String(option.value) === segment) {
            setLabel(String(option.label));
            return;
          }
          // The tab resets rather than carrying over: each account has its own numbers and templates
          navigate(`${basePath}/${option.value}/overview`);
        }}
      />
    </SwitcherCrumb>
  );
};
