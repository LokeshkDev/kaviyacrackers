import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/img/kaviya_crackers_logo.jpeg';

const Footer = () => {
  return (
    <footer className="py-5 bg-dark text-white mt-5">
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-lg-4">
            <img src={logo} alt="Kaviya Crackers Logo" height="60" className="mb-4 brightness-0 invert shadow-sm rounded-2" />
            <p className="text-white-50">Premium quality crackers and fireworks for all your celebrations. Proudly lighting up moments since 2025.</p>
            <div className="d-flex gap-3 mt-4">
              <a href="#" className="social-icon bg-white-10 text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)' }}>
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="social-icon bg-white-10 text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)' }}>
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" className="social-icon bg-white-10 text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)' }}>
                <i className="bi bi-twitter-x"></i>
              </a>
              <a href="#" className="social-icon bg-white-10 text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)' }}>
                <i className="bi bi-youtube"></i>
              </a>
            </div>
          </div>
          <div className="col-lg-2 offset-lg-1">
            <h5 className="fw-bold mb-4 border-bottom border-primary border-3 d-inline-block pb-1">Quick Links</h5>
            <ul className="list-unstyled footer-links">
              <li className="mb-2"><Link to="/" className="text-white-50 text-decoration-none hover-white">Home</Link></li>
              <li className="mb-2"><a href="/#about" className="text-white-50 text-decoration-none hover-white">About Us</a></li>
              <li className="mb-2"><Link to="/shop" className="text-white-50 text-decoration-none hover-white">Products</Link></li>
              <li className="mb-2"><a href="/#safety" className="text-white-50 text-decoration-none hover-white">Safety Tips</a></li>
              <li className="mb-2"><a href="/#contact" className="text-white-50 text-decoration-none hover-white">Contact</a></li>
              <li className="mb-2"><Link to="/admin" className="text-primary fw-bold text-decoration-none">Admin Login</Link></li>
            </ul>
          </div>
          <div className="col-lg-2">
            <h5 className="fw-bold mb-4 border-bottom border-warning border-3 d-inline-block pb-1">Categories</h5>
            <ul className="list-unstyled footer-links">
              <li className="mb-2"><Link to="/shop" className="text-white-50 text-decoration-none hover-white">Sparklers</Link></li>
              <li className="mb-2"><Link to="/shop" className="text-white-50 text-decoration-none hover-white">Flower Pots</Link></li>
              <li className="mb-2"><Link to="/shop" className="text-white-50 text-decoration-none hover-white">Rockets</Link></li>
              <li className="mb-2"><Link to="/shop" className="text-white-50 text-decoration-none hover-white">Gift Boxes</Link></li>
              <li className="mb-2"><Link to="/shop" className="text-white-50 text-decoration-none hover-white">Combo Packs</Link></li>
            </ul>
          </div>
          <div className="col-lg-3">
            <h5 className="fw-bold mb-4 border-bottom border-info border-3 d-inline-block pb-1">Newsletter</h5>
            <p className="text-white-50 small">Subscribe for festival offers and safety updates.</p>
            <div className="input-group mb-3 mt-4">
              <input type="email" className="form-control rounded-start-pill border-0 bg-white-10 text-white px-4" placeholder="Email address" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <button className="btn btn-primary rounded-end-pill px-4"><i className="bi bi-send"></i></button>
            </div>
          </div>
        </div>
        <hr className="my-5 opacity-10" />
        <div className="text-center text-white-50 small">
          <p className="mb-0">&copy; 2026 Kaviya CRACKERS. All Rights Reserved. Designed for Premium Celebrations.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
