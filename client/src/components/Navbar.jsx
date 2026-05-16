import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/img/kaviya_crackers_logo.jpeg';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar navbar-expand-lg navbar-light sticky-top shadow-sm bg-white py-2" id="mainHeader">
      <div className="container">
        {/* Logo and Shop Info */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logo} alt="Kaviya Crackers Logo" height="70" className="me-3 rounded-2" />
          <div className="d-flex flex-column justify-content-center lh-sm">
            <h4 className="fw-bold mb-0" style={{ color: '#ff7a00', letterSpacing: '-0.5px' }}>
              Kaviya <span style={{ color: '#666' }}>Crackers</span>
            </h4>
            <div className="fw-bold text-dark mt-1" style={{ fontSize: '1.1rem' }}>
              Vasanth - <span style={{ letterSpacing: '0.5px' }}>+91 93427 58753</span>
            </div>
          </div>
        </Link>

          {/* Mobile Actions: Cart + Hamburger */}
          <div className="d-flex align-items-center gap-2 order-lg-last">
            <Link to="/shop" className="nav-link position-relative p-2 me-2">
              <i className="bi bi-cart3 fs-4 text-primary"></i>
              {cartCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="navbar-toggler border-0 p-1 shadow-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar">
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>

          {/* Navigation */}
          <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasNavbar">
            <div className="offcanvas-header bg-light border-bottom">
              <div className="d-flex align-items-center">
                <img src={logo} alt="Logo" height="40" className="me-2 rounded-2" />
                <h5 className="offcanvas-title fw-bold text-primary">Kaviya <span className="text-dark">Crackers</span></h5>
              </div>
              <button type="button" className="btn-close shadow-none" data-bs-dismiss="offcanvas"></button>
            </div>
            <div className="offcanvas-body">
              <ul className="navbar-nav ms-auto pe-3 align-items-lg-center gap-1">
                <li className="nav-item">
                  <Link className={`nav-link fw-bold ${isActive('/') ? 'active text-primary' : ''}`} to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link fw-bold ${isActive('/shop') ? 'active text-primary' : ''}`} to="/shop">Shop</Link>
                </li>
                <li className="nav-item">
                  <a className="nav-link fw-bold" href="/#about">About</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link fw-bold" href="/#contact">Contact</a>
                </li>
              </ul>
            </div>
          </div>
      </div>
    </header>
  );
};

export default Navbar;
