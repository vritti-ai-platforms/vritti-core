import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Building2 } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissionContext } from '../providers/PermissionProvider';

// BU selection page — shown after login when user has multiple BU assignments
export const BUSelectionPage = () => {
  const { businessUnits, isLoadingBUs, selectBu } = usePermissionContext();
  const navigate = useNavigate();

  // Auto-select if only one BU
  useEffect(() => {
    if (!isLoadingBUs && businessUnits.length === 1) {
      const bu = businessUnits[0];
      selectBu(bu.id);
      navigate(`/bu-${buildSlug(bu.name, bu.id)}`, { replace: true });
    }
  }, [isLoadingBUs, businessUnits, selectBu, navigate]);

  if (isLoadingBUs) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (businessUnits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="size-10 text-muted-foreground mb-3" />
        <h1 className="text-lg font-semibold">No Access</h1>
        <p className="text-sm text-muted-foreground mt-2">
          You don't have any role assignments yet. Contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-12 px-4">
      <h1 className="text-xl font-semibold mb-2">Select Business Unit</h1>
      <p className="text-sm text-muted-foreground mb-8">Choose a business unit to continue</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
        {businessUnits.map((bu) => (
          <Card
            key={bu.id}
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => {
              selectBu(bu.id);
              navigate(`/bu-${buildSlug(bu.name, bu.id)}`, { replace: true });
            }}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 shrink-0">
                <Building2 className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">{bu.name}</h3>
                <Badge variant="outline" className="text-xs mt-1">
                  {bu.type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
