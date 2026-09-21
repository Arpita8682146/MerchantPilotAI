'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Cart, CartItem, Product } from '@/types';
import { api } from '@/lib/api';
import { getSessionId } from '@/lib/utils';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  sessionId: string;
  addItem: (productId: string, isUpsell?: boolean, addedVia?: string, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  notification: string | null;
  clearNotification: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const fetchCart = async (sid: string) => {
    try {
      setIsLoading(true);
      const data = await api.getCart(sid);
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
    fetchCart(sid);
  }, []);

  const addItem = async (productId: string, isUpsell: boolean = false, addedVia: string = 'ORGANIC', quantity: number = 1) => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      const updated = await api.addCartItem(sessionId, productId, isUpsell, addedVia, quantity);
      setCart(updated);
      setNotification(isUpsell ? '✨ Contextual AI add-on added to your cart!' : 'Added item to cart!');
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setIsLoading(true);
      const updated = await api.removeCartItem(itemId);
      setCart(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to remove item');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCart = async () => {
    if (sessionId) {
      await fetchCart(sessionId);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        sessionId,
        addItem,
        removeItem,
        refreshCart,
        notification,
        clearNotification: () => setNotification(null),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
