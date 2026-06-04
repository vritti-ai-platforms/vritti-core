import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

interface SecurityTabCardProps {
  title: React.ReactNode;
  description: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const SecurityTabCard: React.FC<SecurityTabCardProps> = ({ title, description, isLoading, children }) => (
  <Card>
    <CardHeader>
      {typeof title === 'string' ? <CardTitle>{title}</CardTitle> : title}
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);
