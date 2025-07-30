import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from 'react-router-dom';

interface CartBubbleProps {
  onOpen: () => void;
}

const CartBubble = ({ onOpen }: CartBubbleProps) => {
  const { cartCount } = useCart();
  const location = useLocation();

  // Don't show on cart page
  if (location.pathname === '/cart') {
    return null;
  }

  return (
    <Button
      onClick={onOpen}
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
    >
      <div className="relative">
        <ShoppingBag className="h-6 w-6" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </div>
    </Button>
  );
};

export default CartBubble;