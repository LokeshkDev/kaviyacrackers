import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { CartProvider } from './context/CartContext';

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

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
