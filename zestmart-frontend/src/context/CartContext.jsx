import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { cartApi } from '../api/cart.api';
import { extractError } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, discountAmount: 0, shippingEstimate: 0 });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], subtotal: 0, discountAmount: 0, shippingEstimate: 0 });
      return;
    }
    setLoading(true);
    try {
      const res = await cartApi.get();
      const { cart: synced, removedItems, adjustedItems } = res.data.data;
      setCart(synced);
      if (removedItems?.length) {
        toast(`${removedItems.length} item(s) removed from your cart — no longer available.`);
      }
      if (adjustedItems?.length) {
        toast(`${adjustedItems.length} item(s) had their quantity adjusted for stock.`);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (productId, quantity = 1, variant) => {
    try {
      const res = await cartApi.addItem({ productId, quantity, variant });
      setCart(res.data.data.cart);
      toast.success('Added to cart');
      return { success: true };
    } catch (err) {
      toast.error(extractError(err));
      return { success: false };
    }
  };

  const updateItem = async (productId, quantity) => {
    try {
      const res = await cartApi.updateItem(productId, { quantity });
      setCart(res.data.data.cart);
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const removeItem = async (productId) => {
    try {
      const res = await cartApi.removeItem(productId);
      setCart(res.data.data.cart);
      toast.success('Removed from cart');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const clearCart = async () => {
    try {
      const res = await cartApi.clear();
      setCart(res.data.data.cart);
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const itemCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const total = Math.max((cart.subtotal || 0) - (cart.discountAmount || 0), 0) + (cart.shippingEstimate || 0);

  return (
    <CartContext.Provider
      value={{ cart, loading, itemCount, total, refreshCart, addItem, updateItem, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
