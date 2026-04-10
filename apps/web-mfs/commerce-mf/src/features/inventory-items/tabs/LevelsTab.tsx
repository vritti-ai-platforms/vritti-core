import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import type React from 'react';
import type { InventoryLevelData } from '@/schemas/inventory-items';

interface LevelsTabProps {
  levels: InventoryLevelData[];
  uomSymbol: string | null;
}

export const LevelsTab: React.FC<LevelsTabProps> = ({ levels, uomSymbol }) => {
  if (levels.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No stock levels recorded yet. Stock is updated when goods are received or orders are placed.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Levels by Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Business Unit</th>
                <th className="pb-2 font-medium text-right">Stocked</th>
                <th className="pb-2 font-medium text-right">Reserved</th>
                <th className="pb-2 font-medium text-right">Available</th>
                <th className="pb-2 font-medium text-right">Reorder Level</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level) => {
                const isLow = level.availableQuantity <= level.reorderLevel && level.reorderLevel > 0;
                return (
                  <tr key={level.id} className="border-b last:border-0">
                    <td className="py-3">{level.businessUnitId}</td>
                    <td className="py-3 text-right font-mono">{level.stockedQuantity} {uomSymbol}</td>
                    <td className="py-3 text-right font-mono">{level.reservedQuantity} {uomSymbol}</td>
                    <td className="py-3 text-right font-mono font-medium">{level.availableQuantity} {uomSymbol}</td>
                    <td className="py-3 text-right font-mono">{level.reorderLevel} {uomSymbol}</td>
                    <td className="py-3 text-right">
                      {isLow ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-success/15 text-success">In Stock</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
