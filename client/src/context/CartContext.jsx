import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { api } from '../hooks/useApi';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ phone: '', whatsapp: '', email: '', address: '' });

  const loadData = async () => {
    try {
      const response = await api.get('/data');
      if (response.data) {
        if (response.data.products) setProducts(response.data.products);
        if (response.data.settings) setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Failed to load data in CartContext:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) setSettings(res.data);
    } catch (e) {
      console.error('Failed to refresh settings', e);
    }
  };

  const cartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  const updateCart = (id, delta) => {
    setCart(prev => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newCart = { ...prev };
      if (newQty <= 0) delete newCart[id];
      else newCart[id] = newQty;
      return newCart;
    });
  };

  const clearCart = () => setCart({});

  return (
    <CartContext.Provider value={{ cart, cartCount, updateCart, clearCart, products, settings, refreshSettings }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

