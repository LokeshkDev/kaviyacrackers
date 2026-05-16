import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { api } from '../hooks/useApi';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.get('/data');
        if (response.data && response.data.products) {
          setProducts(response.data.products);
        }
      } catch (error) {
        console.error('Failed to load products in CartContext:', error);
      }
    };
    loadProducts();
  }, []);

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
    <CartContext.Provider value={{ cart, cartCount, updateCart, clearCart, products }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

