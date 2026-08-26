import { Button } from '@vritti/quantum-ui/Button';
import { Select } from '@vritti/quantum-ui/Select';
import { Separator } from '@vritti/quantum-ui/Separator';
import { ChevronsUpDown, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WhatsappAccountSwitcherProps {
  // The raw detail crumb segment — WhatsApp accounts are keyed by UUID, so this is the account id
  // (the selector resolves it to the account name once options load)
  repoName: string;
  // The accounts root, e.g. `/<workspaceSlug>/whatsapp-accounts`
  basePath: string;
}

// Renders the WhatsApp account switcher dropdown in the top bar breadcrumb
export const WhatsappAccountSwitcher = ({ repoName, basePath }: WhatsappAccountSwitcherProps) => {
  const navigate = useNavigate();

  return (
    <Select
      value={repoName}
      searchable
      optionsEndpoint="communications-api/select-api/whatsapp-accounts"
      fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
      // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
      label={undefined}
      searchPlaceholder="Find account..."
      contentClassName="w-60"
      anchor={({ selectedOption }) => (
        <Button
          startAdornment={<MessageCircle className="size-4 text-muted-foreground" />}
          variant="ghost"
          className="h-auto min-w-25 p-0 gap-1.5 text-sm font-normal hover:bg-transparent"
        >
          <span className="flex-1 text-left font-normal text-foreground">{selectedOption?.label ?? repoName}</span>
          <span className="flex items-center justify-center size-6 rounded-full border border-border hover:bg-accent transition-colors">
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
              className="w-full justify-start h-auto px-2 py-1.5 text-sm font-normal"
              onClick={() => navigate(basePath)}
            >
              All WhatsApp Accounts
            </Button>
          </div>
        </>
      }
      onOptionSelect={(option) => {
        // Skip the on-mount initial-resolve fire (same account) — only navigate on a real switch
        if (option && String(option.value) !== repoName) {
          // The tab resets rather than carrying over: each account has its own numbers and templates
          navigate(`${basePath}/${option.value}/overview`);
        }
      }}
    />
  );
};
