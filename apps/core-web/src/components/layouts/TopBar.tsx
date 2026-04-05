import { Button } from '@vritti/quantum-ui/Button';
import { Select } from '@vritti/quantum-ui/Select';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Bell, Building2, Check, ChevronsUpDown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLogo } from '../../hooks/useLogo';
import { useAuth } from '../../providers/AuthProvider';
import { usePermissionContext } from '../../providers/PermissionProvider';
import { UserMenu } from './UserMenu';

export const TopBar = () => {
  const logoImg = useLogo();
  const { org } = useAuth();
  const { selectedBuId, selectBu } = usePermissionContext();
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-border">
      <div className="h-14 px-6 flex items-center justify-between">
        {/* Logo + Org */}
        <div className="flex items-center gap-3">
          {org ? (
            <>
              {org.logoUrl ? (
                <img src={org.logoUrl} alt={org.name} className="h-9 w-auto object-contain" />
              ) : (
                <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                  <Building2 className="size-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">{org.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Powered by</span>
                  <img src={logoImg} alt="Vritti Core" className="h-2.5 w-auto" />
                </div>
              </div>
            </>
          ) : (
            <img src={logoImg} alt="Vritti Core" className="h-8" />
          )}

          {/* BU Switcher — API-based like org switcher */}
          {selectedBuId && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Select
                optionsEndpoint="user-permissions/business-units/select"
                fieldKeys={{ valueKey: 'value', labelKey: 'label', descriptionKey: 'description' }}
                value={selectedBuId}
                contentClassName="w-56"
                anchor={({ selectedOption }) => (
                  <Button
                    startAdornment={<Building2 className="size-3.5 text-muted-foreground" />}
                    variant="ghost"
                    className="h-auto p-0 gap-1.5 text-sm font-normal hover:bg-transparent"
                  >
                    <span className="text-foreground font-medium">
                      {selectedOption?.label ?? 'Select BU'}
                    </span>
                    <ChevronsUpDown className="size-3 text-muted-foreground" />
                  </Button>
                )}
                renderOption={({ option, selected, onSelect }) => (
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto gap-2 px-3 py-1.5 text-sm font-normal"
                    onClick={onSelect}
                  >
                    <span className="flex-1 text-left truncate">{option.label}</span>
                    {option.description && (
                      <span className="shrink-0 rounded-full border border-border px-1.5 py-px text-[10px] font-medium tracking-wider">
                        {option.description}
                      </span>
                    )}
                    {selected && <Check className="size-4 shrink-0" />}
                  </Button>
                )}
                footer={
                  <>
                    <Separator />
                    <div className="p-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-auto px-2 py-1.5 text-sm font-normal"
                        onClick={() => navigate('/')}
                      >
                        All Business Units
                      </Button>
                    </div>
                  </>
                }
                onOptionSelect={(option) => {
                  if (option) {
                    selectBu(String(option.value));
                    navigate(`/bu-${buildSlug(String(option.label), String(option.value))}`);
                  }
                }}
              />
            </>
          )}
        </div>

        {/* Center Space */}
        <div className="flex-1" />

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">Ask Vritti</span>
          </Button>
          <UserMenu />
        </div>
      </div>
    </div>
  );
};
