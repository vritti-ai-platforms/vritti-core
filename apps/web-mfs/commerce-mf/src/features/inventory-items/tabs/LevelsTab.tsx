import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type React from 'react';
import { Link } from 'react-router-dom';
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
                <th className="pb-2 font-medium">Location</th>
                <th className="pb-2 font-medium">Code</th>
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
                    <td className="py-3">
                      {level.locationName ? (
                        <Link
                          to={`/inventory/locations/${buildSlug(level.locationName, level.locationId)}`}
                          className="text-primary hover:underline"
                        >
                          {level.locationName}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 font-mono">{level.locationCode ?? '—'}</td>
                    <td className="py-3 text-right font-mono">{level.stockedQuantity} {uomSymbol}</td>
                    <td className="py-3 text-right font-mono">{level.reservedQuantity} {uomSymbol}</td>
                    <td className="py-3 text-right font-mono font-medium">{level.availableQuantity} {uomSymbol}</td>
                    <td className="py-3 text-right font-mono">{level.reorderLevel} {uomSymbol}</td>
                    <td className="py-3 text-right">
                      {isLow ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="secondary">In Stock</Badge>
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
