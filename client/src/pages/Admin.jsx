import React, { useState, useEffect } from 'react';
import { useApi, api } from '../hooks/useApi';
import logo from '../assets/img/kaviya_crackers_logo.jpeg';
import { Link } from 'react-router-dom';

const Admin = () => {
  const { fetchData, login, updateOrderStatus } = useApi();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newProduct, setNewProduct] = useState({ 
    name: '', category: '', content: '', rate: '', originalRate: '', image: '' 
  });
  const [newCategory, setNewCategory] = useState({ name: '', image: '' });

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const loadData = async () => {
    const data = await fetchData();
    if (data) {
      setOrders(data.orders || []);
      setProducts(data.products || []);
      setCategories(data.categories || []);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await login(username, password);
    if (res.success) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      loadData();
    } else {
      alert(res.message);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    const res = await updateOrderStatus(id, status);
    if (res.success) {
      setOrders(orders.map(o => o._id === id ? { ...o, status } : o));
      loadData();
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const nextProducts = products.filter((p) => String(p._id) !== String(id));
        await api.post('/data', { products: nextProducts, categories, orders });
        loadData();
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const rate = parseInt(String(newProduct.rate), 10);
      const originalRate = parseInt(String(newProduct.originalRate), 10);
      const payload = {
        name: newProduct.name,
        category: newProduct.category,
        content: newProduct.content,
        rate: Number.isFinite(rate) ? rate : 0,
        originalRate: Number.isFinite(originalRate) ? originalRate : 0,
        image: newProduct.image || '',
        active: editingProduct ? editingProduct.active !== false : true,
      };
      let nextProducts;
      if (editingProduct) {
        nextProducts = products.map((p) =>
          String(p._id) === String(editingProduct._id) ? { ...p, ...payload, id: p.id } : p
        );
      } else {
        const maxId = products.length ? Math.max(...products.map((p) => p.id || 0), 0) : 0;
        nextProducts = [...products, { id: maxId + 1, ...payload }];
      }
      await api.post('/data', { products: nextProducts, categories, orders });
      setShowProductModal(false);
      setEditingProduct(null);
      setNewProduct({ name: '', category: '', content: '', rate: '', originalRate: '', image: '' });
      loadData();
    } catch (err) {
      alert("Failed to save product");
    }
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setNewProduct({
      name: p.name,
      category: p.category,
      content: p.content,
      rate: p.rate,
      originalRate: p.originalRate,
      image: p.image
    });
    setShowProductModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      let nextCategories;
      if (editingCategory) {
        nextCategories = categories.map((c) =>
          String(c._id) === String(editingCategory._id)
            ? { ...c, name: newCategory.name, image: newCategory.image || '' }
            : c
        );
      } else {
        nextCategories = [
          ...categories,
          { name: newCategory.name, image: newCategory.image || '', link: 'shop.html' },
        ];
      }
      await api.post('/data', { products, categories: nextCategories, orders });
      setShowCategoryModal(false);
      setEditingCategory(null);
      setNewCategory({ name: '', image: '' });
      loadData();
    } catch (err) {
      alert("Failed to save category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category? This might affect products in this category.")) {
      try {
        const nextCategories = categories.filter((c) => String(c._id) !== String(id));
        await api.post('/data', { products, categories: nextCategories, orders });
        loadData();
      } catch (err) {
        alert("Failed to delete category");
      }
    }
  };

  const openCategoryEditModal = (c) => {
    setEditingCategory(c);
    setNewCategory({ name: c.name, image: c.image });
    setShowCategoryModal(true);
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const endpoint = type === 'product' ? '/api/upload-product' : '/api/upload-category';
      const res = await api.post(endpoint.replace('/api', ''), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        if (type === 'product') {
          setNewProduct({ ...newProduct, image: res.data.path });
        } else {
          setNewCategory({ ...newCategory, image: res.data.path });
        }
      }
    } catch (err) {
      alert("Image upload failed");
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleDownloadInvoice = async (order) => {
    const invoiceDate = new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const invoiceNo = `KAV-${String(order._id).slice(-6).toUpperCase()}`;
    const items = order.items || [];

    // Convert logo to base64 data URI for embedding in the invoice
    let logoBase64 = '';
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = logo;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      logoBase64 = canvas.toDataURL('image/jpeg', 0.9);
    } catch (_) { /* fallback: no logo */ }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invoiceNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px; }
    .invoice-container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #EAB308; }
    .brand { display: flex; align-items: center; gap: 16px; }
    .brand-logo { width: 70px; height: 70px; border-radius: 14px; border: 2px solid #EAB308; object-fit: cover; box-shadow: 0 4px 12px rgba(234, 179, 8,0.15); }
    .brand-info h1 { color: #EAB308; font-size: 28px; margin-bottom: 4px; }
    .brand-info p { color: #888; font-size: 13px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { color: #EAB308; font-size: 32px; letter-spacing: 2px; margin-bottom: 10px; }
    .invoice-meta p { color: #666; font-size: 13px; line-height: 1.6; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .info-box { flex: 1; }
    .info-box h4 { color: #EAB308; text-transform: uppercase; font-size: 11px; letter-spacing: 1.5px; margin-bottom: 8px; }
    .info-box p { font-size: 13px; color: #555; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead th { background: #EAB308; color: #fff; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    tbody td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 13px; }
    tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; }
    tbody tr:nth-child(even) { background: #fdf8f3; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0; }
    .totals-row.grand { border-bottom: none; border-top: 2px solid #EAB308; padding-top: 12px; margin-top: 4px; font-size: 18px; font-weight: 700; color: #EAB308; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
    .footer p { margin-bottom: 4px; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-processing { background: #cce5ff; color: #004085; }
    .status-delivered { background: #d4edda; color: #155724; }
    @media print { body { padding: 20px; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="brand">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Kaviya Crackers" class="brand-logo" />` : ''}
        <div class="brand-info">
          <h1>Kaviya Crackers</h1>
          <p>Premium Fireworks &amp; Festive Crackers</p>
          <p>Sivakasi, Tamil Nadu | +91 93427 58753</p>
        </div>
      </div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <p><strong>Invoice No:</strong> ${invoiceNo}</p>
        <p><strong>Date:</strong> ${invoiceDate}</p>
        <p><span class="status-badge status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span></p>
      </div>
    </div>
    <div class="info-row">
      <div class="info-box">
        <h4>Bill To</h4>
        <p><strong>${order.customerName || 'N/A'}</strong></p>
        <p>${order.customerPhone || ''}</p>
        <p>${order.customerEmail || ''}</p>
        <p>${order.customerAddress || ''}</p>
      </div>
      <div class="info-box" style="text-align: right;">
        <h4>From</h4>
        <p><strong>Kaviya Crackers</strong></p>
        <p>Festival Plaza, Main Road</p>
        <p>Sivakasi, Tamil Nadu</p>
        <p>info@kaviyacrackers.com</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Item Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.name || 'Product'}</td>
            <td style="text-align:right">${item.quantity || 0}</td>
            <td style="text-align:right">₹${item.rate || 0}</td>
            <td style="text-align:right">₹${item.subtotal || ((item.rate || 0) * (item.quantity || 0))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>₹${order.totalAmount || 0}</span>
        </div>
        <div class="totals-row">
          <span>Discount</span>
          <span>-₹0</span>
        </div>
        <div class="totals-row grand">
          <span>Grand Total</span>
          <span>₹${order.totalAmount || 0}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p><strong>Thank you for your order!</strong></p>
      <p>For queries, call +91 93427 58753 or WhatsApp us.</p>
      <p style="margin-top:8px;">This is a computer-generated invoice.</p>
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!isAuthenticated) {
    return (
      <section id="loginSection" className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-4">
              <div className="bg-white p-5 rounded-5 shadow-lg text-center border-top border-5 border-primary">
                <img src={logo} alt="Logo" height="80" className="mb-4 rounded-3 shadow-sm" />
                <h3 className="fw-bold mb-4">Admin Access</h3>
                <form onSubmit={handleLogin}>
                  <div className="form-floating mb-3">
                    <input type="text" className="form-control rounded-4 border-light bg-light" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
                    <label>Username</label>
                  </div>
                  <div className="form-floating mb-3">
                    <input type="password" className="form-control rounded-4 border-light bg-light" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                    <label>Password</label>
                  </div>
                  <button type="submit" className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-lg hover-scale mt-3">Login Securely</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="container-fluid p-0 overflow-hidden">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-lg-2 bg-white min-vh-100 border-end p-4 sidebar shadow-sm position-fixed z-3">
          <div className="text-center mb-5">
            <img src={logo} alt="Logo" height="50" className="rounded-2 shadow-sm" />
            <h6 className="mt-3 fw-bold text-uppercase small tracking-widest text-primary">Kaviya Admin</h6>
          </div>
          <nav className="nav flex-column gap-2">
            {[
              { id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' },
              { id: 'products', icon: 'box-seam', label: 'Products' },
              { id: 'categories', icon: 'grid', label: 'Categories' },
              { id: 'orders', icon: 'cart-check', label: 'Enquiries' },
            ].map(item => (
              <button key={item.id} 
                      className={`nav-link border-0 text-start rounded-4 py-3 px-4 d-flex align-items-center gap-3 transition-all ${activeSection === item.id ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-muted hover-light'}`}
                      onClick={() => setActiveSection(item.id)}>
                <i className={`bi bi-${item.icon} fs-5`}></i>
                <span className="fw-semibold">{item.label}</span>
              </button>
            ))}
            <Link className="nav-link border-0 text-start rounded-4 py-3 px-4 d-flex align-items-center gap-3 text-muted bg-transparent mt-2 text-decoration-none hover-light" to="/shop">
              <i className="bi bi-eye fs-5"></i>
              <span className="fw-semibold">View Store</span>
            </Link>
            <hr className="my-4 opacity-10" />
            <button className="nav-link border-0 text-start rounded-4 py-3 px-4 d-flex align-items-center gap-3 text-danger bg-transparent hover-soft-danger"
                    onClick={() => { sessionStorage.removeItem('admin_auth'); setIsAuthenticated(false); }}>
              <i className="bi bi-box-arrow-left fs-5"></i>
              <span className="fw-semibold">Logout</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="col-lg-10 offset-lg-2 p-5 bg-light min-vh-100">
          
          {activeSection === 'dashboard' && (
            <div className="admin-section animate-fade-in">
              <h2 className="fw-bold mb-4">Dashboard Overview</h2>
              <div className="row g-4 mb-5">
                {[
                  { label: 'Total Products', val: products.length, icon: 'box', color: 'primary' },
                  { label: 'Active Categories', val: categories.length, icon: 'grid', color: 'warning' },
                  { label: 'New Enquiries', val: orders.filter(o => o.status === 'Pending').length, icon: 'chat-dots', color: 'info' },
                  { label: 'Delivered Orders', val: orders.filter(o => o.status === 'Delivered').length, icon: 'check-circle', color: 'success' }
                ].map((stat, i) => (
                  <div className="col-md-3" key={i}>
                    <div className="bg-white p-4 rounded-5 shadow-sm border-0 h-100 transition-up">
                      <div className={`bg-soft-${stat.color} text-${stat.color} rounded-4 p-3 d-inline-block mb-3`}>
                        <i className={`bi bi-${stat.icon} fs-4`}></i>
                      </div>
                      <h3 className="fw-bold mb-1">{stat.val}</h3>
                      <p className="text-muted small mb-0 fw-semibold text-uppercase">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeSection === 'products' && (
            <div className="admin-section animate-fade-in">
              <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                  <h2 className="fw-bold m-0">Product Catalog</h2>
                  <p className="text-muted mb-0">Manage your price list and product visibility</p>
                </div>
                <button className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-lg hover-scale" 
                        onClick={() => { setEditingProduct(null); setNewProduct({name:'', category:'', content:'', rate:'', originalRate:'', image:''}); setShowProductModal(true); }}>
                  <i className="bi bi-plus-lg me-2"></i> Add New Product
                </button>
              </div>

              <div className="bg-white rounded-5 shadow-sm border-0 overflow-hidden">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light border-bottom">
                    <tr>
                      <th className="ps-4 py-3">Img</th>
                      <th className="py-3">Product Name</th>
                      <th className="py-3">Category</th>
                      <th className="py-3 text-center">Price</th>
                      <th className="text-end pe-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id}>
                        <td className="ps-4">
                          <img src={p.image ? (p.image.startsWith('http') ? p.image : `/${p.image}`) : logo} alt={p.name} width="50" height="50" className="rounded-3 shadow-sm object-fit-cover" />
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{p.name}</div>
                          <div className="small text-muted">{p.content}</div>
                        </td>
                        <td><span className="badge bg-soft-primary text-primary rounded-pill px-3">{p.category}</span></td>
                        <td className="text-center">
                          <div className="fw-bold text-primary">₹{p.rate}</div>
                          <div className="text-muted small text-decoration-line-through">₹{p.originalRate}</div>
                        </td>
                        <td className="text-end pe-4">
                          <button className="btn btn-sm btn-soft-primary rounded-circle me-2 p-2" onClick={() => openEditModal(p)}><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-sm btn-soft-danger rounded-circle p-2" onClick={() => handleDeleteProduct(p._id)}><i className="bi bi-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'orders' && (
            <div className="admin-section animate-fade-in">
              <h2 className="fw-bold mb-2">Customer Enquiries</h2>
              <p className="text-muted mb-5">Review and manage festival order enquiries</p>
              
              <div className="bg-white rounded-5 shadow-sm border-0 overflow-hidden">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light border-bottom">
                    <tr>
                      <th className="ps-4 py-3">Date</th>
                      <th className="py-3">Customer Info</th>
                      <th className="py-3">Address & Contact</th>
                      <th className="py-3 text-center">Total</th>
                      <th className="py-3 text-center">Actions</th>
                      <th className="text-end pe-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-5 text-muted">No enquiries found.</td></tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order._id}>
                          <td className="ps-4 small text-muted lh-1">
                            {new Date(order.date).toLocaleDateString()}<br/>
                            <span style={{fontSize:'0.7rem'}}>{new Date(order.date).toLocaleTimeString()}</span>
                          </td>
                          <td>
                            <div className="fw-bold">{order.customerName}</div>
                            <div className="small text-primary fw-semibold">{order.customerPhone}</div>
                          </td>
                          <td>
                            <div className="small text-muted" style={{maxWidth:'250px'}}>{order.customerAddress}</div>
                            <div className="small text-info">{order.customerEmail}</div>
                          </td>
                          <td className="text-center fw-bold text-primary">₹{order.totalAmount}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-sm" onClick={() => handleViewOrder(order)}>
                              <i className="bi bi-eye me-1"></i>View
                            </button>
                          </td>
                          <td className="text-end pe-4">
                            <div className="dropdown">
                              <button className={`btn btn-sm dropdown-toggle rounded-pill px-3 shadow-sm ${order.status === 'Delivered' ? 'btn-success' : (order.status === 'Processing' ? 'btn-warning text-white' : 'btn-light')}`} 
                                      data-bs-toggle="dropdown">
                                {order.status}
                              </button>
                              <ul className="dropdown-menu border-0 shadow rounded-4">
                                <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order._id, 'Pending')}>Pending</button></li>
                                <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order._id, 'Processing')}>Processing</button></li>
                                <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order._id, 'Delivered')}>Delivered</button></li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'categories' && (
            <div className="admin-section animate-fade-in">
              <div className="d-flex justify-content-between align-items-center mb-5">
                <h2 className="fw-bold m-0">Categories</h2>
                <button className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-lg hover-scale"
                        onClick={() => { setEditingCategory(null); setNewCategory({name:'', image:''}); setShowCategoryModal(true); }}>
                  <i className="bi bi-plus-lg me-2"></i> Add Category
                </button>
              </div>
              <div className="row g-4">
                {categories.map((cat, i) => (
                  <div className="col-md-3" key={i}>
                    <div className="card border-0 rounded-5 shadow-sm overflow-hidden h-100 hover-up">
                      <img src={cat.image ? (cat.image.startsWith('http') ? cat.image : `/${cat.image}`) : logo} className="card-img-top" alt={cat.name} style={{ height: '150px', objectFit: 'cover' }} />
                      <div className="card-body p-4 text-center">
                        <h5 className="fw-bold mb-3">{cat.name}</h5>
                        <div className="d-flex justify-content-center gap-2">
                          <button className="btn btn-sm btn-soft-primary rounded-pill px-3" onClick={() => openCategoryEditModal(cat)}>Edit</button>
                          <button className="btn btn-sm btn-soft-danger rounded-pill px-3" onClick={() => handleDeleteCategory(cat._id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-5 border-0 shadow-lg">
              <div className="modal-header border-0 p-4">
                <h5 className="fw-bold mb-0">{editingProduct ? 'Edit Product' : 'Add New Product'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowProductModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSaveProduct}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Product Name</label>
                    <input type="text" className="form-control rounded-4 bg-light border-0 py-2" placeholder="e.g. 10cm Sparklers" required 
                           value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Category</label>
                      <select className="form-select rounded-4 bg-light border-0 py-2" required
                              value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                        <option value="">Select...</option>
                        {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Content (e.g. 10 Pcs)</label>
                      <input type="text" className="form-control rounded-4 bg-light border-0 py-2" required
                             value={newProduct.content} onChange={e => setNewProduct({...newProduct, content: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Offer Rate (₹)</label>
                      <input type="number" className="form-control rounded-4 bg-light border-0 py-2" required
                             value={newProduct.rate} onChange={e => setNewProduct({...newProduct, rate: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Original Rate (₹)</label>
                      <input type="number" className="form-control rounded-4 bg-light border-0 py-2" required
                             value={newProduct.originalRate} onChange={e => setNewProduct({...newProduct, originalRate: e.target.value})} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Product Image</label>
                      <div className="d-flex gap-3 align-items-center">
                        <input type="file" className="form-control rounded-4 bg-light border-0 py-2" 
                               accept="image/*" onChange={e => handleImageUpload(e, 'product')} />
                        {newProduct.image && (
                          <img src={newProduct.image.startsWith('http') ? newProduct.image : `/${newProduct.image}`} 
                               width="40" height="40" className="rounded shadow-sm object-fit-cover" />
                        )}
                      </div>
                      <input type="text" className="form-control rounded-4 bg-light border-0 py-2 mt-2 small" 
                             style={{fontSize:'0.7rem'}} placeholder="Or paste image URL/path"
                             value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
                    </div>
                  </div>
                  <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold mt-4 shadow-lg hover-scale" type="submit">
                    {editingProduct ? 'Update Changes' : 'Add to Catalog'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-5 border-0 shadow-lg">
              <div className="modal-header border-0 p-4">
                <h5 className="fw-bold mb-0">{editingCategory ? 'Edit Category' : 'Add New Category'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCategoryModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSaveCategory}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Category Name</label>
                    <input type="text" className="form-control rounded-4 bg-light border-0 py-2" placeholder="e.g. Sparklers" required 
                           value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Category Image</label>
                    <div className="d-flex gap-3 align-items-center mb-2">
                      <input type="file" className="form-control rounded-4 bg-light border-0 py-2" 
                             accept="image/*" onChange={e => handleImageUpload(e, 'category')} />
                      {newCategory.image && (
                        <img src={newCategory.image.startsWith('http') ? newCategory.image : `/${newCategory.image}`} 
                             width="40" height="40" className="rounded shadow-sm object-fit-cover" />
                      )}
                    </div>
                    <input type="text" className="form-control rounded-4 bg-light border-0 py-2 small" 
                           style={{fontSize:'0.7rem'}} placeholder="Or paste image URL/path"
                           value={newCategory.image} onChange={e => setNewCategory({...newCategory, image: e.target.value})} />
                  </div>
                  <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold mt-4 shadow-lg hover-scale" type="submit">
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-5 border-0 shadow-lg">
              <div className="modal-header border-0 p-4 pb-2">
                <div>
                  <h5 className="fw-bold mb-1">
                    <i className="bi bi-receipt-cutoff me-2 text-primary"></i>
                    Order Details
                  </h5>
                  <span className="text-muted small">Invoice #{`KAV-${String(selectedOrder._id).slice(-6).toUpperCase()}`}</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowOrderModal(false)}></button>
              </div>
              <div className="modal-body p-4 pt-2">
                {/* Customer Info Card */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <h6 className="fw-bold text-uppercase small mb-2" style={{fontSize:'0.7rem', color:'#EAB308'}}>Customer</h6>
                      <p className="fw-bold mb-1">{selectedOrder.customerName}</p>
                      <p className="small text-muted mb-1"><i className="bi bi-telephone me-1"></i>{selectedOrder.customerPhone}</p>
                      <p className="small text-muted mb-0"><i className="bi bi-envelope me-1"></i>{selectedOrder.customerEmail}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <h6 className="fw-bold text-uppercase small mb-2" style={{fontSize:'0.7rem', color:'#EAB308'}}>Delivery</h6>
                      <p className="small text-muted mb-1"><i className="bi bi-geo-alt me-1"></i>{selectedOrder.customerAddress}</p>
                      <p className="small text-muted mb-1"><i className="bi bi-calendar3 me-1"></i>{new Date(selectedOrder.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <span className={`badge rounded-pill px-3 py-1 ${
                        selectedOrder.status === 'Delivered' ? 'bg-success' : 
                        selectedOrder.status === 'Processing' ? 'bg-warning text-dark' : 'bg-secondary'
                      }`}>{selectedOrder.status}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-4 border overflow-hidden shadow-sm">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{backgroundColor:'#EAB308'}}>
                      <tr>
                        <th className="py-3 ps-4 text-white" style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>#</th>
                        <th className="py-3 text-white" style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Item Name</th>
                        <th className="py-3 text-center text-white" style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Qty</th>
                        <th className="py-3 text-end text-white" style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Unit Price</th>
                        <th className="py-3 text-end pe-4 text-white" style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="ps-4 text-muted small">{idx + 1}</td>
                          <td className="fw-semibold">{item.name || 'Product'}</td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold">{item.quantity || 0}</span>
                          </td>
                          <td className="text-end text-muted">₹{item.rate || 0}</td>
                          <td className="text-end pe-4 fw-bold text-primary">₹{item.subtotal || ((item.rate || 0) * (item.quantity || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-top-2">
                        <td colSpan="4" className="text-end fw-bold py-3 pe-3 fs-6">Grand Total</td>
                        <td className="text-end pe-4 fw-bold text-primary py-3 fs-5">₹{selectedOrder.totalAmount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer border-0 p-4 pt-2">
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowOrderModal(false)}>
                  Close
                </button>
                <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={() => handleDownloadInvoice(selectedOrder)}>
                  <i className="bi bi-download me-2"></i>Download Invoice PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
