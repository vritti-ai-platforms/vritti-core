import { Card, CardContent, CardHeader } from '@vritti/quantum-ui/Card';
import { ThemeToggle } from '@vritti/quantum-ui/theme';
import type React from 'react';
import { Outlet } from 'react-router-dom';
import Logo from '../../assets/logo.png';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Theme toggle - fixed to viewport top-right */}
      <div className="hidden sm:block fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-[448px] min-h-[60svh] border-border shadow-lg gap-0">
        <CardHeader className="flex flex-col items-center pt-6 pb-4">
          <img src={Logo} alt="Vritti AI Cloud" className="h-12 sm:h-14 lg:h-12 w-auto mb-4" />
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Outlet />
        </CardContent>
      </Card>
    </div>
  );
};
