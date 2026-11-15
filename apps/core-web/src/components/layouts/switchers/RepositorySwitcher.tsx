import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { FolderGit2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RepositorySelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface RepositorySwitcherProps {
  // Repositories are keyed by name, so the raw breadcrumb segment is both the value and the fallback label
  segment: string;
  // The repositories root, e.g. `/<kind>/<id>/repositories`
  basePath: string;
}

// Renders the repository switcher dropdown in the top bar breadcrumb
export const RepositorySwitcher = ({ segment, basePath }: RepositorySwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(segment);

  return (
    <SwitcherCrumb icon={FolderGit2} label={label} to={`${basePath}/${segment}/overview`}>
      <RepositorySelector
        value={segment}
        // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
        label={undefined}
        searchPlaceholder="Find repository..."
        contentClassName="w-60"
        anchor={() => <SwitcherTrigger label="Switch repository" />}
        footer={
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="w-full justify-start h-auto px-2 py-1.5 text-sm font-normal"
                onClick={() => navigate(basePath)}
              >
                All Repositories
              </Button>
            </div>
          </>
        }
        onOptionSelect={(option) => {
          if (!option) return;
          // The on-mount initial-resolve fire is the current repository: it names the crumb; any other is a real switch
          if (String(option.value) === segment) {
            setLabel(String(option.label));
            return;
          }
          // The tab resets rather than carrying over: a tab that suits one repository (an empty one has
          // no code or runs) need not suit the next
          navigate(`${basePath}/${option.value}/overview`);
        }}
      />
    </SwitcherCrumb>
  );
};
