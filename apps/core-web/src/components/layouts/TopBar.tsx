import { Breadcrumb } from '@vritti/quantum-ui/Breadcrumb';
import { Button } from '@vritti/quantum-ui/Button';
import { Bell, Building2, ChevronRight, Sparkles } from 'lucide-react';
import { useLogo } from '../../hooks/useLogo';
import { useAuth } from '../../providers/AuthProvider';
import { usePermissionContext } from '../../providers/PermissionProvider';
import { BUSwitcher } from './BUSwitcher';
import { UserMenu } from './UserMenu';

const BU_SLUG_PREFIX = 'bu-';

export const TopBar = () => {
  const logoImg = useLogo();
  const { org } = useAuth();
  const { selectedBuId } = usePermissionContext();

  const showBreadcrumb = !!selectedBuId;

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
                  <span className="text-xs text-muted-foreground">Powered by</span>
                  <img src={logoImg} alt="Vritti Core" className="h-2.5 w-auto" />
                </div>
              </div>
            </>
          ) : (
            <img src={logoImg} alt="Vritti Core" className="h-8" />
          )}
        </div>

        {showBreadcrumb && <ChevronRight className="size-4 text-muted-foreground shrink-0 mx-2" />}

        {/* Breadcrumb with BU switcher as first segment */}
        <div className="flex-1">
          {showBreadcrumb && (
            <Breadcrumb
              maxItems={4}
              renderSegment={(segment) => {
                if (segment.raw.startsWith(BU_SLUG_PREFIX)) {
                  return (
                    <BUSwitcher
                      currentBuId={segment.id ?? segment.raw}
                      currentBuName={segment.slug ? segment.label : undefined}
                    />
                  );
                }
                return undefined;
              }}
            />
          )}
        </div>

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
