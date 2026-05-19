import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/img/kaviya_crackers_logo.jpeg';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { cart, cartCount, updateCart, products } = useCart();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const cartItems = Object.keys(cart).map(id => {
    const product = products.find(p => p.id == id);
    return product ? { ...product, quantity: cart[id] } : null;
  }).filter(Boolean);

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);

  const closeOffcanvas = () => {
    const offcanvasElement = document.getElementById('offcanvasNavbar');
    if (offcanvasElement && offcanvasElement.classList.contains('show')) {
      const closeBtn = offcanvasElement.querySelector('.btn-close');
      if (closeBtn) closeBtn.click();
    }
  };

  return (
    <>
      <header className="navbar navbar-expand-lg navbar-light sticky-top shadow-sm bg-white py-2" id="mainHeader">
        <div className="container px-2 px-md-3">
          {/* Logo and Shop Info */}
          <Link className="navbar-brand d-flex align-items-center me-auto" to="/" style={{ maxWidth: '75%' }}>
            <img src={logo} alt="Kaviya Crackers Logo" height="40" className="me-2 rounded-2 d-md-none" />
            <img src={logo} alt="Kaviya Crackers Logo" height="70" className="me-3 rounded-2 d-none d-md-block" />
            <div className="d-flex flex-column justify-content-center lh-1 overflow-hidden">
              <h5 className="fw-bold mb-0 d-md-none" style={{ color: '#ff7a00', fontSize: '0.85rem' }}>
                Kaviya <span style={{ color: '#666' }}>Crackers</span>
              </h5>
              <h4 className="fw-bold mb-0 d-none d-md-block" style={{ color: '#ff7a00', letterSpacing: '-0.5px' }}>
                Kaviya <span style={{ color: '#666' }}>Crackers</span>
              </h4>
              <div className="fw-bold text-dark mt-1 d-md-none" style={{ fontSize: '0.6rem' }}>
                Vasanth - +91 93427 58753
              </div>
              <div className="fw-bold text-dark mt-1 d-none d-md-block" style={{ fontSize: '1.1rem' }}>
                Vasanth - <span style={{ letterSpacing: '0.5px' }}>+91 93427 58753</span>
              </div>
            </div>
          </Link>


          {/* Mobile Actions: Cart + Hamburger */}
          <div className="d-flex align-items-center gap-1 gap-md-2 order-lg-last">
            <button className="nav-link position-relative p-2 border-0 bg-transparent" type="button" data-bs-toggle="offcanvas" data-bs-target="#cartOffcanvas">
              <i className="bi bi-cart3 fs-4 text-primary"></i>
              {cartCount > 0 && (
                <span className="position-absolute top-1 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                  {cartCount}
                </span>
              )}
            </button>
            <button className="navbar-toggler border-0 p-1 shadow-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar">
              <span className="navbar-toggler-icon" style={{ width: '1.2em', height: '1.2em' }}></span>
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
                  <Link className={`nav-link fw-bold ${isActive('/') ? 'active text-primary' : ''}`} to="/" onClick={closeOffcanvas}>Home</Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link fw-bold ${isActive('/shop') ? 'active text-primary' : ''}`} to="/shop" onClick={closeOffcanvas}>Shop</Link>
                </li>
                <li className="nav-item">
                  <a className="nav-link fw-bold" href="/#about" onClick={closeOffcanvas}>About</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link fw-bold" href="/#contact" onClick={closeOffcanvas}>Contact</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>


      {/* Cart Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="cartOffcanvas" aria-labelledby="cartOffcanvasLabel">
        <div className="offcanvas-header bg-primary text-white">
          <h5 className="offcanvas-title fw-bold" id="cartOffcanvasLabel">Your Shopping Cart</h5>
          <button type="button" className="btn-close btn-close-white shadow-none" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body p-0 d-flex flex-column">
          {cartItems.length === 0 ? (
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4 text-center">
              <i className="bi bi-cart-x fs-1 text-muted mb-3"></i>
              <h5 className="fw-bold">Your cart is empty</h5>
              <p className="text-muted">Browse our shop and add some festive crackers!</p>
              <Link to="/shop" className="btn btn-primary rounded-pill px-4" data-bs-dismiss="offcanvas">Go to Shop</Link>
            </div>
          ) : (
            <>
              <div className="flex-grow-1 overflow-auto p-3">
                {cartItems.map(item => (
                  <div key={item.id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                    <img 
                      src={item.image ? (item.image.startsWith('http') ? item.image : `/${item.image}`) : logo} 
                      alt={item.name} 
                      width="60" 
                      height="60" 
                      className="rounded-3 shadow-sm object-fit-cover me-3"
                    />
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-1 small">{item.name}</h6>
                      <div className="fw-bold text-muted extra-small mb-1 lh-1">{item.content}</div>
                      <div className="text-primary fw-bold">₹{item.rate}</div>
                      <div className="d-flex align-items-center mt-2 bg-light rounded-pill px-2 py-1" style={{ width: 'fit-content' }}>
                        <button className="btn btn-sm btn-link p-0 text-decoration-none fw-bold" onClick={() => updateCart(item.id, -1)}>−</button>
                        <span className="mx-3 small fw-bold">{item.quantity}</span>
                        <button className="btn btn-sm btn-link p-0 text-decoration-none fw-bold" onClick={() => updateCart(item.id, 1)}>+</button>
                      </div>
                    </div>
                    <div className="text-end fw-bold">
                      ₹{item.rate * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-light border-top mt-auto">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">Total:</h5>
                  <h4 className="fw-bold text-primary mb-0">₹{totalAmount}</h4>
                </div>
                {totalAmount < 3000 ? (
                  <div className="alert alert-warning py-2 px-3 rounded-4 small fw-bold mb-3">
                    Min Order ₹3000 (Add ₹{3000 - totalAmount} more)
                  </div>
                ) : null}
                <Link to="/shop" className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow mb-2" data-bs-dismiss="offcanvas">
                  Checkout / Send Enquiry
                </Link>
                <button className="btn btn-outline-secondary w-100 py-2 rounded-pill fw-bold border-0" data-bs-dismiss="offcanvas">
                  Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;

