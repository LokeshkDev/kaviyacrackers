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

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleSubmitEnquiry = async (e) => {
    e.preventDefault();
    try {
      const orderItems = Object.keys(cart).map(id => {
        const product = products.find(p => p.id == id);
        return { productId: id, name: product.name, quantity: cart[id], rate: product.rate, subtotal: product.rate * cart[id] };
      });

      const orderData = { customerName: formData.name, customerPhone: formData.phone, customerEmail: formData.email, customerAddress: `${formData.address}, Pincode: ${formData.pincode}`, items: orderItems, totalAmount };
      await api.post('/orders', orderData);
      
      const message = `*Kaviya Crackers - New Order*%0A%0A*Name:* ${formData.name}%0A*Phone:* ${formData.phone}%0A*Total:* ₹${totalAmount}%0A%0A_Items:_ %0A${orderItems.map(i => `- ${i.name} (x${i.quantity})`).join('%0A')}`;
      window.open(`https://wa.me/919342758753?text=${message}`, '_blank');

      setShowEnquiryModal(false);
      setShowSuccessModal(true);
      clearCart();
    } catch (err) { alert("Failed to submit enquiry."); }
  };

  return (
    <main className="py-5">
      <div className="container-fluid px-lg-5">
        
        {/* Search & Filter - NEAT BOUTIQUE UI */}
        <div className="row g-3 mb-4 justify-content-center">
          <div className="col-md-5">
            <div className="input-group shadow-sm rounded-pill overflow-hidden border">
              <span className="input-group-text bg-white border-0 ps-4"><i className="bi bi-search text-primary"></i></span>
              <input type="text" className="form-control border-0 py-3 shadow-none" placeholder="Search for products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <div className="input-group shadow-sm rounded-pill overflow-hidden border">
              <span className="input-group-text bg-white border-0 ps-4"><i className="bi bi-filter text-primary"></i></span>
              <select className="form-select border-0 py-3 shadow-none" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Product Table - NEAT ROUNDED STRUCTURE */}
        <div className="table-responsive shadow-lg rounded-4 mb-5 border">
          <table className="table table-hover align-middle mb-0 shop-table">
            <thead>
              <tr>
                <th className="ps-2 text-center col-img">Img</th>
                <th className="px-1">Product Details</th>
                <th className="text-center col-rate">Rate</th>
                <th className="text-center col-qty">Qty</th>
                <th className="text-end pe-2 col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedProducts).length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No products found.</td></tr>
              ) : (
                Object.keys(groupedProducts).map(catName => (
                  <React.Fragment key={catName}>
                    <tr className="category-row">
                      <td colSpan="5" className="py-4 ps-4 fw-bold text-dark border-bottom fs-5">{catName}</td>
                    </tr>
                    {groupedProducts[catName].map(p => (
                      <tr key={p.id}>
                        <td className="text-center">
                          <img 
                            src={p.image ? (p.image.startsWith('http') ? p.image : `/${p.image}`) : logo} 
                            alt={p.name} 
                            width="60" 
                            height="60" 
                            className="rounded-3 shadow-sm object-fit-cover"
                            onError={(e) => { e.target.src = logo; }}
                          />
                        </td>
                        <td>
                          <div className="fw-bold text-dark fs-6">{p.name}</div>
                          <div className="text-muted small mb-1">{p.content}</div>
                        </td>
                        <td className="text-center">
                          <div className="text-muted small text-decoration-line-through mb-1">₹{p.originalRate || Math.round(p.rate * 1.5)}</div>
                          <div className="bg-success text-white fw-bold py-2 px-3 rounded-4 d-inline-block shadow-sm">₹{p.rate}</div>
                        </td>
                        <td className="text-center">
                          {!cart[p.id] ? (
                            <button className="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold w-100 shadow-sm transition-all" onClick={() => updateCart(p.id, 1)}>
                              Add
                            </button>
                          ) : (
                            <div className="d-flex align-items-center justify-content-between bg-white rounded-pill p-1 border border-primary shadow-sm overflow-hidden">
                              <button className="btn btn-link text-decoration-none fw-bold px-3 py-0 text-primary fs-5" onClick={() => updateCart(p.id, -1)}>−</button>
                              <span className="fw-bold px-1">{cart[p.id]}</span>
                              <button className="btn btn-link text-decoration-none fw-bold px-3 py-0 text-primary fs-5" onClick={() => updateCart(p.id, 1)}>+</button>
                            </div>
                          )}
                        </td>
                        <td className="text-end pe-3 fw-bold text-primary fs-5">₹{(cart[p.id] || 0) * p.rate}</td>
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
            <button onClick={handleOpenEnquiry} className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-lg py-3 hover-scale">
              <i className="bi bi-send-fill me-2"></i> Send Order Enquiry
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed-bottom bg-white shadow-lg p-3 border-top d-lg-none" style={{ zIndex: 1030 }}>
        {totalAmount < 3000 && totalAmount > 0 && <div className="text-danger text-center small fw-bold mb-2 animate-fade-in">Min Order ₹3000 (Add ₹{3000 - totalAmount} more)</div>}
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <div className="text-muted small lh-1">Total Amount</div>
            <div className="fs-4 fw-bold text-primary">₹{totalAmount}</div>
          </div>
          <button onClick={handleOpenEnquiry} className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm">Send Enquiry</button>
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-5 border-0 shadow">
              <div className="modal-header border-0 p-4 pb-0">
                <h5 className="fw-bold mb-0 text-primary"><i className="bi bi-send-fill me-2"></i>Complete Your Enquiry</h5>
                <button type="button" className="btn-close" onClick={() => setShowEnquiryModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted small mb-4">Please provide your details. Our team will contact you shortly.</p>
                <form onSubmit={handleSubmitEnquiry}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Full Name *</label>
                    <input type="text" id="name" className="form-control rounded-3" placeholder="Enter your name" required value={formData.name} onChange={handleFormChange} />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Phone *</label>
                      <input type="tel" id="phone" className="form-control rounded-3" placeholder="10-digit" pattern="[0-9]{10}" required value={formData.phone} onChange={handleFormChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Email *</label>
                      <input type="email" id="email" className="form-control rounded-3" placeholder="Email" required value={formData.email} onChange={handleFormChange} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Address *</label>
                    <textarea id="address" className="form-control rounded-3" rows="2" placeholder="House No, City..." required value={formData.address} onChange={handleFormChange}></textarea>
                  </div>
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Pincode *</label>
                    <input type="text" id="pincode" className="form-control rounded-3" placeholder="6-digit" pattern="[0-9]{6}" required value={formData.pincode} onChange={handleFormChange} />
                  </div>
                  <div className="bg-light p-3 rounded-4 mb-4 border">
                    <div className="d-flex justify-content-between align-items-center fw-bold">
                      <span className="text-muted">Total:</span>
                      <span className="text-primary fs-4">₹{totalAmount}</span>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow hover-scale">Submit Enquiry</button>
                </form>
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
              <p className="text-muted">Thank you. Our team will contact you shortly.</p>
              <button className="btn btn-primary rounded-pill px-5 py-2 mt-4 fw-bold" onClick={() => setShowSuccessModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Shop;
