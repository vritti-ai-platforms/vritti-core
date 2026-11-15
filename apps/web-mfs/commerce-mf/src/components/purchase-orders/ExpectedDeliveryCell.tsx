import { Button } from '@vritti/quantum-ui/Button';
import { DateCell } from '@vritti/quantum-ui/DataTable';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type React from 'react';
import { Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { workspaceBase } from '@/utils/workspace';

interface ExpectedDeliveryCellProps {
  date: string;
  deliveryNumbers: string[];
  deliveryIds: string[];
  deliveryDates: string[];
}

// A line's own expected delivery, with the inbound deliveries carrying it and the day each is expected — read-only here,
// a delivery's date is changed on the delivery and never moves the line's
export const ExpectedDeliveryCell: React.FC<ExpectedDeliveryCellProps> = ({
  date,
  deliveryNumbers,
  deliveryIds,
  deliveryDates,
}) => {
  const fmt = useFormatters();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <span className="flex flex-col">
      <DateCell value={date} />
      {deliveryNumbers.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {'On '}
          {deliveryNumbers.map((deliveryNumber, index) => {
            const deliveryId = deliveryIds[index];
            const deliveryDate = deliveryDates[index];
            return (
              <Fragment key={deliveryId ?? deliveryNumber}>
                {index > 0 && ', '}
                {deliveryId ? (
                  <Button
                    variant="link"
                    size="xs"
                    className="h-auto p-0 text-xs"
                    onClick={() =>
                      navigate(`${workspaceBase(pathname)}/inbound-deliveries/${buildSlug(deliveryNumber, deliveryId)}`)
                    }
                  >
                    {deliveryNumber}
                  </Button>
                ) : (
                  deliveryNumber
                )}
                {deliveryDate && ` (${fmt.date(deliveryDate).primary})`}
              </Fragment>
            );
          })}
        </span>
      )}
    </span>
  );
};
