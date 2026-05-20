import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { CartProvider } from './context/CartContext';

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (!isAdminPage) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000, colors: ['#7209B7', '#D4AF37', '#FFD700', '#FF7A00'] };

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
      }, 250);

      return () => clearInterval(interval);
    }
  }, [location.pathname, isAdminPage]);

  return (
    <CartProvider>
      <div className="app">
        {!isAdminPage && (
          <>
            <div className="top-marquee" aria-label="Kaviya Crackers announcements">
              <div className="marquee-track">
                <span>Festival Sale is Live - Premium Crackers at Best Prices</span>
                <span>Wholesale Orders Available - Fast Support on WhatsApp</span>
                <span>Safe Packaging for Every Celebration</span>
                <span>Book Your Combo Packs Early for 2026 Festive Season</span>
              </div>
            </div>
            <Navbar />
          </>
        )}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>

        {!isAdminPage && <Footer />}
      </div>
    </CartProvider>
  );
}

export default App;
