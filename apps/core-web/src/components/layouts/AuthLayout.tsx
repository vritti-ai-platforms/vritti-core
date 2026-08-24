import { Card, CardContent, CardHeader } from '@vritti/quantum-ui/Card';
import { ThemeToggle } from '@vritti/quantum-ui/theme';
import { Building2 } from 'lucide-react';
import type React from 'react';
import { Outlet } from 'react-router-dom';
import { useLogo } from '../../hooks/useLogo';
import { useOrgLogo } from '../../hooks/useOrgLogo';
import { useAuth } from '../../providers/AuthProvider';

export const AuthLayout: React.FC = () => {
  const logo = useLogo();
  const orgLogo = useOrgLogo();
  const { org, isOrgNotFound, isLoading } = useAuth();

  // Org not found — show error instead of login
  if (isOrgNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-destructive/15 mb-4">
              <Building2 className="size-8 text-destructive" />
            </div>
            <h1 className="text-lg font-semibold">Organization Not Found</h1>
            <p className="text-sm text-muted-foreground mt-2">
              No organization exists for this address. Please check the URL and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Theme toggle - fixed to viewport top-right */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md min-h-[60svh] border-border shadow-lg gap-0">
        <CardHeader className="flex flex-col items-center pt-8 pb-4">
          {!isLoading && org ? (
            <>
              {orgLogo ? (
                <img src={orgLogo} alt={org.name} className="h-20 w-auto object-contain mb-2" />
              ) : (
                <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-2">
                  <Building2 className="size-8 text-primary" />
                </div>
              )}
              <h1 className="text-lg font-semibold">{org.name}</h1>
              <div className="flex items-center gap-1.5 mt-2 ">
                <span className="text-xs text-muted-foreground">Powered by</span>
                <img src={logo} alt="Vritti" className="h-3.5 w-auto" />
              </div>
            </>
          ) : (
            <img src={logo} alt="Vritti Core" className="h-12 sm:h-14 lg:h-12 w-auto mb-4" />
          )}
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Outlet />
        </CardContent>
      </Card>
    </div>
  );
};
