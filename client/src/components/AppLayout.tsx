import { useState } from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import CartBubble from '@/components/CartBubble';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <Header onCartOpen={() => setIsCartOpen(true)} />
      {children}
      <CartBubble onOpen={() => setIsCartOpen(true)} />
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
};

export default AppLayout;