import React, { useState, useEffect, useMemo } from 'react';
import { useApi, api } from '../hooks/useApi';
import logo from '../assets/img/kaviya_crackers_logo.jpeg';
import { useCart } from '../context/CartContext';

const Shop = () => {
  const { fetchData } = useApi();
  const { cart, updateCart, clearCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal State
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', pincode: '' });

  useEffect(() => {
    const load = async () => {
      const data = await fetchData();
      if (data) {
        setProducts(data.products || []);
        setCategories(data.categories || []);
      }
    };
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const groupedProducts = useMemo(() => {
    const groups = {};
    filteredProducts.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const totalAmount = useMemo(() => {
    let total = 0;
    Object.keys(cart).forEach(id => {
      const product = products.find(p => p.id == id);
      if (product) total += product.rate * cart[id];
    });
    return total;
  }, [cart, products]);

  const handleOpenEnquiry = () => {
    if (totalAmount < 3000) {
      alert("Minimum order amount is ₹3000. Please add more items.");
      return;
    }
    setShowEnquiryModal(true);
  };

  const cartItems = useMemo(() => {
    return Object.keys(cart).map(id => {
      const product = products.find(p => p.id == id);
      return product ? { ...product, quantity: cart[id] } : null;
    }).filter(Boolean);
  }, [cart, products]);

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleSubmitEnquiry = async (e) => {
    e.preventDefault();
    try {
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        rate: item.rate,
        subtotal: item.rate * item.quantity
      }));

      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        customerAddress: `${formData.address}, Pincode: ${formData.pincode}`,
        items: orderItems,
        totalAmount
      };
      await api.post('/orders', orderData);

      setShowEnquiryModal(false);
      setShowSuccessModal(true);
      clearCart();
    } catch (err) { alert("Failed to submit enquiry."); }
  };

  return (
    <main className="py-5">
      <div className="container-fluid px-2 px-md-5">

        {/* Search & Filter - NEAT BOUTIQUE UI */}
        <div className="row g-2 g-md-3 mb-4 justify-content-center">
          <div className="col-8 col-md-5">
            <div className="input-group shadow-sm rounded-pill overflow-hidden border">
              <span className="input-group-text bg-white border-0 ps-3 ps-md-4"><i className="bi bi-search text-primary"></i></span>
              <input type="text" className="form-control border-0 py-2 py-md-3 shadow-none" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="col-4 col-md-3">
            <div className="input-group shadow-sm rounded-pill overflow-hidden border">
              <span className="input-group-text bg-white border-0 ps-2 ps-md-4 d-none d-sm-flex"><i className="bi bi-filter text-primary"></i></span>
              <select className="form-select border-0 py-2 py-md-3 shadow-none ps-2 ps-md-4" style={{ fontSize: '0.85rem' }} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                <option value="all">All</option>
                {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Product Table - NEAT ROUNDED STRUCTURE */}
        <div className="table-responsive shadow-lg rounded-4 mb-5 border overflow-hidden">
          <table className="table table-hover align-middle mb-0 shop-table w-100">
            <thead>
              <tr>
                <th className="ps-2 text-center col-img d-none d-md-table-cell">Img</th>
                <th className="px-1 px-md-3">Product Details</th>
                <th className="text-center col-rate px-1 px-md-3">
                  <div className="rate-header-container">
                    <span className="rate-title">Rate</span>
                    <span className="rate-offer-badge">80% Offer</span>
                  </div>
                </th>
                <th className="text-center col-qty">Qty</th>
                <th className="text-end pe-2 pe-md-4 col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedProducts).length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No products found.</td></tr>
              ) : (
                Object.keys(groupedProducts).map(catName => (
                  <React.Fragment key={catName}>
                    <tr className="category-row">
                      <td colSpan="5" className="py-2 py-md-4 ps-3 ps-md-4 fw-bold text-dark border-bottom fs-6 fs-md-5">{catName}</td>
                    </tr>
                    {groupedProducts[catName].map(p => (
                      <tr key={p.id}>
                        <td className="text-center d-none d-md-table-cell">
                          <img
                            src={p.image ? (p.image.startsWith('http') ? p.image : `/${p.image}`) : logo}
                            alt={p.name}
                            width="60"
                            height="60"
                            className="rounded-3 shadow-sm object-fit-cover"
                            onError={(e) => { e.target.src = logo; }}
                          />
                        </td>
                        <td className="px-1 px-md-3" style={{ minWidth: '120px' }}>
                          <div className="d-flex align-items-start">
                            <img
                              src={p.image ? (p.image.startsWith('http') ? p.image : `/${p.image}`) : logo}
                              alt={p.name}
                              width="40"
                              height="40"
                              className="rounded-2 shadow-sm object-fit-cover me-2 d-md-none mt-1"
                              onError={(e) => { e.target.src = logo; }}
                            />
                            <div>
                              <div className="fw-bold text-dark fs-custom-mobile lh-sm mb-1">{p.name}</div>
                              <div className="fw-bold lh-1">{p.content}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center" style={{ width: '65px' }}>
                          <div className="fw-bold text-decoration-line-through mb-0 d-md-none" style={{ fontSize: '0.55rem' }}>₹{p.originalRate || Math.round(p.rate * 1.5)}</div>
                          <div className="fw-bold text-decoration-line-through mb-0 d-none d-md-block">₹{p.originalRate || Math.round(p.rate * 1.5)}</div>
                          <div className="bg-success text-white fw-bold py-1 px-1 rounded-4 d-inline-block shadow-sm">₹{p.rate}</div>
                        </td>
                        <td className="text-center" style={{ width: '80px' }}>
                          {!cart[p.id] ? (
                            <button className="btn btn-outline-primary rounded-pill px-2 py-1 fw-bold w-100 shadow-sm transition-all" onClick={() => updateCart(p.id, 1)}>
                              Add
                            </button>
                          ) : (
                            <div className="d-flex align-items-center justify-content-between bg-white rounded-pill p-0 border border-primary shadow-sm overflow-hidden">
                              <button className="btn btn-link text-decoration-none fw-bold px-2 py-0 text-primary fs-6" onClick={() => updateCart(p.id, -1)}>−</button>
                              <span className="fw-bold px-0 small">{cart[p.id]}</span>
                              <button className="btn btn-link text-decoration-none fw-bold px-2 py-0 text-primary fs-6" onClick={() => updateCart(p.id, 1)}>+</button>
                            </div>
                          )}
                        </td>
                        <td className="text-end pe-1 pe-md-4 fw-bold text-primary fs-6" style={{ width: '70px' }}>₹{(cart[p.id] || 0) * p.rate}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Floating Display Logic */}
      <div className="floating-total-bar d-none d-lg-block border-top border-5 border-primary">
        <div className="container-fluid px-5">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-4">
              <div className="lh-1">
                <div className="text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Grand Total</div>
                <div className="fs-1 fw-bold text-primary">₹{totalAmount}</div>
              </div>
              {totalAmount < 3000 && totalAmount > 0 && (
                <div className="alert alert-danger mb-0 py-2 px-3 rounded-4 small fw-bold border-0 shadow-sm animate-fade-in" style={{ backgroundColor: '#ffdada', color: '#d9534f' }}>
                  Min Order ₹3000 (Add ₹{3000 - totalAmount} more)
                </div>
              )}
            </div>
            <button onClick={handleOpenEnquiry} className="btn btn-primary btn-lg rounded-pill fw-bold shadow-lg hover-scale">
              <i className="bi bi-send-fill me-2"></i> Send Order Enquiry
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed-bottom bg-white shadow-lg p-2 p-md-3 border-top d-lg-none" style={{ zIndex: 1030 }}>
        {totalAmount < 3000 && totalAmount > 0 && <div className="text-danger text-center extra-small fw-bold mb-1 animate-fade-in">Min Order ₹3000 (Add ₹{3000 - totalAmount} more)</div>}
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <div className="text-muted small lh-1">Total Amount</div>
            <div className="fs-5 fw-bold text-primary">₹{totalAmount}</div>
          </div>
          <button onClick={handleOpenEnquiry} className="btn btn-primary rounded-pill px-3 py-2 fw-bold shadow-sm small">Send Enquiry</button>
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-5 border-0 shadow overflow-hidden">
              <div className="row g-0">
                {/* Form Column */}
                <div className="col-lg-7 p-4 p-md-5">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold mb-0 text-primary"><i className="bi bi-send-fill me-2"></i>Send Enquiry</h4>
                    <button type="button" className="btn-close d-lg-none" onClick={() => setShowEnquiryModal(false)}></button>
                  </div>
                  <form onSubmit={handleSubmitEnquiry}>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Full Name *</label>
                      <input type="text" id="name" className="form-control rounded-3 py-2" placeholder="Enter your name" required value={formData.name} onChange={handleFormChange} />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Phone *</label>
                        <input type="tel" id="phone" className="form-control rounded-3 py-2" placeholder="10-digit number" pattern="[0-9]{10}" required value={formData.phone} onChange={handleFormChange} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Email *</label>
                        <input type="email" id="email" className="form-control rounded-3 py-2" placeholder="Your email address" required value={formData.email} onChange={handleFormChange} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Full Delivery Address *</label>
                      <textarea id="address" className="form-control rounded-3 py-2" rows="2" placeholder="House No, Street, City..." required value={formData.address} onChange={handleFormChange}></textarea>
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Pincode *</label>
                      <input type="text" id="pincode" className="form-control rounded-3 py-2" placeholder="6-digit pincode" pattern="[0-9]{6}" required value={formData.pincode} onChange={handleFormChange} />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow hover-scale">Confirm & Send to WhatsApp</button>
                    <button type="button" className="btn btn-link w-100 mt-2 text-muted text-decoration-none small d-md-none" onClick={() => setShowEnquiryModal(false)}>Close</button>
                  </form>
                </div>

                {/* Cart Summary Column */}
                <div className="col-lg-5 bg-light border-start p-4 p-md-5 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Order Summary</h5>
                    <button type="button" className="btn-close d-none d-lg-block" onClick={() => setShowEnquiryModal(false)}></button>
                  </div>
                  <div className="flex-grow-1 overflow-auto mb-4" style={{ maxHeight: '300px' }}>
                    {cartItems.map(item => (
                      <div key={item.id} className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-white">
                        <div className="pe-3">
                          <div className="fw-bold small">{item.name}</div>
                          <div className="text-muted extra-small mb-1">{item.content}</div>
                          <div className="text-muted extra-small">₹{item.rate} x {item.quantity}</div>
                        </div>
                        <div className="fw-bold text-primary">₹{item.rate * item.quantity}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted fw-bold">Items Total:</span>
                      <span className="fw-bold">₹{totalAmount}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-4 pt-3 border-top">
                      <h4 className="fw-bold mb-0">Grand Total:</h4>
                      <h3 className="fw-bold text-primary mb-0">₹{totalAmount}</h3>
                    </div>
                    <div className="bg-white p-3 rounded-4 border small">
                      <i className="bi bi-info-circle-fill text-primary me-2"></i>
                      Estimated delivery within 3-5 business days after confirmation.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-5 border-0 shadow text-center p-5">
              <div className="mb-4"><i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i></div>
              <h3 className="fw-bold mb-2">Enquiry Sent!</h3>
              <p className="text-muted mb-3">Thank you. Our team will contact you shortly.</p>
              
              <div className="alert border-0 rounded-4 p-3 small text-start mt-2" style={{ backgroundColor: 'rgba(255, 122, 0, 0.08)', color: '#FF7A00' }}>
                <div className="d-flex gap-2">
                  <i className="bi bi-envelope-fill fs-5 mt-0"></i>
                  <div>
                    <span className="fw-bold d-block mb-1" style={{ fontSize: '0.85rem' }}>Order Details Email Sent</span>
                    <span style={{ color: '#555', fontSize: '0.78rem', display: 'inline-block', lineHeight: '1.3' }}>
                      You'll receive an email of your order details. Please check your <strong>junk/spam folder</strong> too to verify your orders.
                    </span>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary rounded-pill px-5 py-2 mt-3 fw-bold" onClick={() => setShowSuccessModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Shop;

