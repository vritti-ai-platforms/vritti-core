import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Package } from 'lucide-react';
import type React from 'react';

export const InventoryRecipeTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Recipe</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
          <div className="flex items-center justify-center size-16 rounded-full bg-muted">
            <Package className="size-8" />
          </div>
          <div className="text-center">
            <p className="font-medium">Coming Soon</p>
            <p className="text-sm">Inventory recipe management will be available once the inventory module is built.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
