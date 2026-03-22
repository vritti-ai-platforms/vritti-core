import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Separator } from '@vritti/quantum-ui/Separator';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useCommerceContext } from '../../context/CommerceContext';
import { useCreateOrder, useProducts } from '../../hooks';
import type { Product } from '../../schemas';

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export const POSPage = () => {
  const { businessUnitId } = useCommerceContext();
  const { data: products = [], isLoading } = useProducts(businessUnitId);
  const createOrderMutation = useCreateOrder();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Adds a product to the cart or increments existing quantity
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: Number(product.price), quantity: 1 }];
    });
  }, []);

  // Updates the quantity for a cart item
  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    );
  }, []);

  // Removes an item from the cart
  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Places the order and clears the cart
  const handleCheckout = () => {
    if (cart.length === 0) return;
    createOrderMutation.mutate(
      {
        businessUnitId,
        source: 'WALK_IN',
        paymentMethod: 'CASH',
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
      { onSuccess: () => setCart([]) },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Product grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products
            .filter((p) => p.isAvailable && p.isActive)
            .map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4 text-center">
                  <Typography className="font-medium truncate">{product.name}</Typography>
                  <Typography intent="muted" className="mt-1">
                    ${product.price}
                  </Typography>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Cart sidebar */}
      <div className="w-80 shrink-0 flex flex-col border-l pl-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="size-5" />
          <Typography variant="h4">Cart</Typography>
          <Typography intent="muted" className="ml-auto">
            {cart.length} items
          </Typography>
        </div>

        <div className="flex-1 overflow-auto space-y-3">
          {cart.length === 0 ? (
            <Typography intent="muted" align="center" className="py-8">
              No items in cart
            </Typography>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <Typography variant="body2" className="truncate">
                    {item.name}
                  </Typography>
                  <Typography intent="muted" variant="caption">
                    ${item.unitPrice.toFixed(2)} each
                  </Typography>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => updateQuantity(item.productId, -1)}
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => updateQuantity(item.productId, 1)}
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
                <Typography variant="body2" className="w-16 text-right font-medium">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </Typography>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => removeFromCart(item.productId)}>
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <div className="flex justify-between font-semibold">
            <Typography>Total</Typography>
            <Typography>${cartTotal.toFixed(2)}</Typography>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0}
            isLoading={createOrderMutation.isPending}
            onClick={handleCheckout}
          >
            Place Order
          </Button>
        </div>
      </div>
    </div>
  );
};
