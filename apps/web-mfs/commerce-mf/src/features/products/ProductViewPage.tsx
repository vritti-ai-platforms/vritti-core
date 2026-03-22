import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader } from '@vritti/quantum-ui/Card';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Typography } from '@vritti/quantum-ui/Typography';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProduct } from '../../hooks';

export const ProductViewPage = () => {
  const { id } = useSlugParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center py-20">
        <Typography intent="muted">Product not found</Typography>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={product.description ?? undefined}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Typography variant="h4">Details</Typography>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <Typography intent="muted">Price</Typography>
              <Typography>${product.price}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">SKU</Typography>
              <Typography>{product.sku ?? '-'}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Unit</Typography>
              <Typography>{product.unit ?? '-'}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Sort Order</Typography>
              <Typography>{product.sortOrder}</Typography>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Typography variant="h4">Status</Typography>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Typography intent="muted">Available</Typography>
              <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                {product.isAvailable ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <Typography intent="muted">Active</Typography>
              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                {product.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Created</Typography>
              <Typography>{new Date(product.createdAt).toLocaleDateString()}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography intent="muted">Updated</Typography>
              <Typography>{new Date(product.updatedAt).toLocaleDateString()}</Typography>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
