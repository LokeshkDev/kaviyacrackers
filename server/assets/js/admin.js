const DEMO_PASS = "123456";
let products = [];
let categories = [];
let orders = [];

// Auth Logic
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;
    const result = await apiLogin(username, password);
    
    if (result.success) {
        sessionStorage.setItem('admin_auth', 'true');
        checkAuth();
    } else {
        alert(result.message || 'Invalid Credentials');
    }
});

async function checkAuth() {
    if (sessionStorage.getItem('admin_auth') === 'true') {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        // Initial sync from server
        const data = await apiFetchData();
        if (data) {
            products = data.products || [];
            categories = data.categories || [];
            orders = data.orders || [];
            // Merge with local if first time? No, let's trust server for backend mode.
        }
        
        renderAdminProducts();
        renderAdminCategories();
        renderAdminOrders();
        updateCategoryDropdowns();
    }
}

async function syncWithServer() {
    await apiSaveData({
        products,
        categories,
        orders,
        settings: JSON.parse(localStorage.getItem('Kaviya_settings') || '{}')
    });
}

function logout() {
    sessionStorage.removeItem('admin_auth');
    location.reload();
}

// Product Management
async function loadAdminProducts() {
    const data = await apiFetchData();
    if (data && data.products) {
        products = data.products;
    }
    renderAdminProducts();
}

function renderAdminProducts() {
    const list = document.getElementById('adminProductList');
    list.innerHTML = '';

    products.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="ps-4">
                <img src="${safeMediaSrc(p.image)}" alt="${p.name}" class="rounded-2" 
                    onerror="this.src='assets/img/Kaviya_crackers_logo.jpeg'"
                    style="width: 40px; height: 40px; object-fit: cover; border: 1px solid #eee;">
            </td>
            <td>
                <div class="fw-bold">${p.name}</div>
                <div class="text-muted small">${p.content}</div>
            </td>
            <td><span class="badge bg-light text-dark">${p.category}</span></td>
            <td>₹${p.rate}</td>
            <td><span class="text-muted text-decoration-line-through small">₹${p.originalRate || '-'}</span></td>
            <td class="text-end pe-4">
                <div class="form-check form-switch d-inline-block align-middle me-3">
                    <input class="form-check-input cursor-pointer" type="checkbox" role="switch" 
                        ${p.active !== false ? 'checked' : ''} 
                        onchange="toggleStatus(${p.id})">
                </div>
                <button class="btn btn-sm btn-outline-primary me-2 rounded-3" onclick="editProduct(${p.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-3" onclick="deleteProduct(${p.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        list.appendChild(row);
    });
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prodId').value;
    const name = document.getElementById('prodName').value;
    const category = document.getElementById('prodCategory').value;
    const content = document.getElementById('prodContent').value;
    const rate = parseInt(document.getElementById('prodRate').value);
    const originalRate = parseInt(document.getElementById('prodOriginalRate').value);
    const manualPath = document.getElementById('prodManualPath').value;
    const fileInput = document.getElementById('prodImage');

    let finalImage = manualPath;
    
    // Handle real file upload
    if (fileInput.files && fileInput.files[0]) {
        const uploadedPath = await apiUploadImage(fileInput.files[0], 'product');
        if (uploadedPath) finalImage = uploadedPath;
    }

    if (id) {
        const index = products.findIndex(p => p.id === parseInt(id));
        products[index] = { 
            ...products[index], 
            name, 
            category, 
            content, 
            rate, 
            originalRate,
            image: finalImage || products[index].image
        };
    } else {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ 
            id: newId, 
            name, 
            category, 
            content, 
            rate, 
            originalRate, 
            image: finalImage || 'assets/img/Kaviya_crackers_logo.jpeg', 
            active: true 
        });
    }

    saveProducts();
    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    modal.hide();
    renderAdminProducts();
});

function editProduct(id) {
    const p = products.find(prod => prod.id == id);
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodContent').value = p.content;
    document.getElementById('prodRate').value = p.rate;
    document.getElementById('prodOriginalRate').value = p.originalRate || '';
    document.getElementById('prodManualPath').value = p.image.startsWith('data:') ? '' : p.image;

    const preview = document.getElementById('prodImagePreview');
    if (p.image) {
        preview.style.display = 'block';
        preview.querySelector('img').src = safeMediaSrc(p.image);
    } else {
        preview.style.display = 'none';
    }

    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function toggleStatus(id) {
    const index = products.findIndex(p => p.id == id);
    if (index !== -1) {
        products[index].active = products[index].active === false ? true : false;
        saveProducts();
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id != id);
        saveProducts();
        renderAdminProducts();
    }
}

function saveProducts() {
    localStorage.setItem('Kaviya_products', JSON.stringify(products));
    syncWithServer();
}

function clearForm() {
    document.getElementById('prodId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('prodImagePreview').style.display = 'none';
    document.getElementById('prodManualPath').value = '';
}

// Product Image Preview
document.getElementById('prodImage')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('prodImagePreview');
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            preview.style.display = 'block';
            preview.querySelector('img').src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId + 'Section').style.display = 'block';

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function updateSetting(key, value) {
    const settings = JSON.parse(localStorage.getItem('Kaviya_settings') || '{}');
    settings[key] = value;
    localStorage.setItem('Kaviya_settings', JSON.stringify(settings));
}

// Category Management
function loadAdminCategories() {
    const stored = localStorage.getItem('Kaviya_categories');
    if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate from old string format to object format
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
            categories = parsed.map(name => ({ name, image: '', link: '' }));
            saveCategories();
        } else {
            categories = parsed;
        }
    } else {
        categories = [
            { name: "Sparklers", image: "", link: "" },
            { name: "Flower Pots", image: "", link: "" },
            { name: "Rockets", image: "", link: "" },
            { name: "Ground Chakkars", image: "", link: "" },
            { name: "Fancy Crackers", image: "", link: "" },
            { name: "Bombs", image: "", link: "" },
            { name: "Kids Crackers", image: "", link: "" },
            { name: "Gift Boxes", image: "", link: "" }
        ];
        saveCategories();
    }
    renderAdminCategories();
    updateCategoryDropdowns();
}

function renderAdminCategories() {
    const list = document.getElementById('adminCategoryList');
    if (!list) return;
    list.innerHTML = '';
    categories.forEach((cat, index) => {
        const card = document.createElement('div');
        card.className = 'col-md-3';
        const imgSrc = safeMediaSrc(cat.image);
        card.innerHTML = `
            <div class="stat-card text-center p-3">
                <img src="${imgSrc}" alt="${cat.name}" class="rounded-3 mb-3"
                    onerror="this.src='assets/img/Kaviya_crackers_logo.jpeg'"
                    style="width:80px; height:80px; object-fit:cover; border:2px solid #eee;">
                <h6 class="fw-bold mb-1">${cat.name}</h6>
                ${cat.link ? `<div class="text-muted small text-truncate mb-2" title="${cat.link}"><i class="bi bi-link-45deg"></i> ${cat.link}</div>` : '<div class="text-muted small mb-2">No link set</div>'}
                <div class="d-flex gap-2 justify-content-center">
                    <button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="editCategory(${index})">
                        <i class="bi bi-pencil me-1"></i>Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="deleteCategory(${index})">
                        <i class="bi bi-trash me-1"></i>Delete
                    </button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function openCategoryModal() {
    document.getElementById('catEditIndex').value = '';
    document.getElementById('catName').value = '';
    document.getElementById('catLink').value = '';
    document.getElementById('catImage').value = '';
    document.getElementById('catManualPath').value = '';
    document.getElementById('catImagePreview').innerHTML = '';
    document.getElementById('categoryModalTitle').innerText = 'Add Category';
    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    modal.show();
}

function editCategory(index) {
    const cat = categories[index];
    document.getElementById('catEditIndex').value = index;
    document.getElementById('catName').value = cat.name;
    document.getElementById('catLink').value = cat.link || '';
    document.getElementById('catImage').value = '';
    document.getElementById('catManualPath').value = cat.image.startsWith('data:') ? '' : cat.image;
    document.getElementById('categoryModalTitle').innerText = 'Edit Category';
    
    const preview = document.getElementById('catImagePreview');
    if (cat.image) {
        preview.innerHTML = `<img src="${safeMediaSrc(cat.image)}" class="rounded-3" style="width:60px;height:60px;object-fit:cover;">`;
    } else {
        preview.innerHTML = '';
    }

    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    modal.show();
}

function previewCatImage(input) {
    const preview = document.getElementById('catImagePreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" class="rounded-3" style="width:60px;height:60px;object-fit:cover;">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editIndex = document.getElementById('catEditIndex').value;
    const name = document.getElementById('catName').value.trim();
    const link = document.getElementById('catLink').value.trim();
    const manualPath = document.getElementById('catManualPath').value.trim();
    const fileInput = document.getElementById('catImage');

    let finalImage = manualPath;

    // Handle real file upload
    if (fileInput.files && fileInput.files[0]) {
        const uploadedPath = await apiUploadImage(fileInput.files[0], 'category');
        if (uploadedPath) finalImage = uploadedPath;
    }

    if (editIndex !== '') {
        categories[parseInt(editIndex)].name = name;
        categories[parseInt(editIndex)].link = link;
        if (finalImage) categories[parseInt(editIndex)].image = finalImage;
    } else {
        if (categories.find(c => c.name === name)) {
            alert('Category already exists!');
            return;
        }
        categories.push({ name, image: finalImage || 'assets/img/Kaviya_crackers_logo.jpeg', link });
    }
    
    saveCategories();
    renderAdminCategories();
    updateCategoryDropdowns();
    bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
});

function saveCategories() {
    localStorage.setItem('Kaviya_categories', JSON.stringify(categories));
    syncWithServer();
}

function deleteCategory(index) {
    if (confirm(`Delete "${categories[index].name}"? Products in this category will still exist.`)) {
        categories.splice(index, 1);
        saveCategories();
        renderAdminCategories();
        updateCategoryDropdowns();
    }
}

function saveCategories() {
    syncWithServer();
}

function updateCategoryDropdowns() {
    const select = document.getElementById('prodCategory');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
    if (categories.find(c => c.name === currentVal)) select.value = currentVal;
}

// Order Management
async function loadAdminOrders() {
    const data = await apiFetchData();
    if (data && data.orders) {
        orders = data.orders;
    }
    renderAdminOrders();
}

function renderAdminOrders() {
    const list = document.getElementById('adminOrderList');
    if (!list) return;
    list.innerHTML = '';
    
    const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedOrders.forEach(order => {
        const row = document.createElement('tr');
        const statusClass = order.status === 'Delivered' ? 'bg-success' : (order.status === 'Processing' ? 'bg-warning' : 'bg-secondary');
        row.innerHTML = `
            <td class="ps-4 small">${new Date(order.date).toLocaleString()}</td>
            <td>
                <div class="fw-bold">${order.customer.name}</div>
                <div class="text-muted small">${order.customer.phone}</div>
            </td>
            <td class="fw-bold text-primary">₹${order.total}</td>
            <td><span class="badge ${statusClass}">${order.status || 'Pending'}</span></td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-outline-primary rounded-pill" onclick="viewOrderDetails('${order.id}')">View</button>
                <div class="dropdown d-inline-block">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle rounded-pill" data-bs-toggle="dropdown">Status</button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${order.id}', 'Pending')">Pending</a></li>
                        <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${order.id}', 'Processing')">Processing</a></li>
                        <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${order.id}', 'Delivered')">Delivered</a></li>
                    </ul>
                </div>
            </td>
        `;
        list.appendChild(row);
    });
}

async function updateOrderStatus(id, status) {
    const res = await apiUpdateOrderStatus(id, status);
    if (res.success) {
        const order = orders.find(o => o.id === id);
        if (order) order.status = status;
        renderAdminOrders();
    }
}

function viewOrderDetails(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    let itemsHtml = order.items.map(item => `
        <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
            <span>${item.name} (${item.qty} ${item.content || ''})</span>
            <span class="fw-bold">₹${item.rate * item.qty}</span>
        </div>
    `).join('');

    const modalHtml = `
        <div class="modal fade" id="orderDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content rounded-4 border-0 shadow">
                    <div class="modal-header">
                        <h5 class="modal-title fw-bold">Order Details - ${order.id.slice(-6).toUpperCase()}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <h6 class="text-muted text-uppercase small fw-bold">Customer Info</h6>
                                <p class="mb-1"><strong>Name:</strong> ${order.customer.name}</p>
                                <p class="mb-1"><strong>Phone:</strong> ${order.customer.phone}</p>
                                <p class="mb-1"><strong>Email:</strong> ${order.customer.email}</p>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-muted text-uppercase small fw-bold">Address Info</h6>
                                <p class="mb-1"><strong>Address:</strong> ${order.customer.address}</p>
                                <p class="mb-1"><strong>Pincode:</strong> ${order.customer.pincode}</p>
                            </div>
                        </div>
                        <h6 class="text-muted text-uppercase small fw-bold mb-3">Items Ordered</h6>
                        <div class="mb-4">${itemsHtml}</div>
                        <div class="d-flex justify-content-between fs-4 fw-bold text-primary">
                            <span>Grand Total:</span>
                            <span>₹${order.total}</span>
                        </div>
                    </div>
                    <div class="modal-footer border-0 d-flex gap-2">
                        <button class="btn btn-outline-primary flex-fill rounded-pill py-2" onclick="printInvoice('${order.id}')">
                            <i class="bi bi-printer me-2"></i> Print Invoice
                        </button>
                        <button class="btn btn-success flex-fill rounded-pill py-2" onclick="window.open('https://wa.me/91${order.customer.phone.replace(/\D/g,'')}')">
                            <i class="bi bi-whatsapp me-2"></i> Message Customer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const oldModal = document.getElementById('orderDetailsModal');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
}

function printInvoice(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const orderDate = new Date(order.date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const orderTime = new Date(order.date).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
    });

    let itemRows = '';
    let sNo = 1;
    order.items.forEach(item => {
        itemRows += `
            <tr>
                <td style="padding:10px 12px; border-bottom:1px solid #eee;">${sNo++}</td>
                <td style="padding:10px 12px; border-bottom:1px solid #eee;">${item.name}</td>
                <td style="padding:10px 12px; border-bottom:1px solid #eee; text-align:center;">${item.content || '-'}</td>
                <td style="padding:10px 12px; border-bottom:1px solid #eee; text-align:center;">${item.qty}</td>
                <td style="padding:10px 12px; border-bottom:1px solid #eee; text-align:right;">₹${item.rate}</td>
                <td style="padding:10px 12px; border-bottom:1px solid #eee; text-align:right; font-weight:600;">₹${item.rate * item.qty}</td>
            </tr>
        `;
    });

    const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice - Kaviya Crackers</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 40px; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #ff6b35, #ff8f5e); color: white; padding: 30px 40px; display: flex; justify-content: space-between; align-items: center; }
            .header .logo-area { display: flex; align-items: center; gap: 15px; }
            .header .logo-area img { width: 60px; height: 60px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.5); }
            .header .shop-name { font-size: 24px; font-weight: 700; }
            .header .shop-sub { font-size: 12px; opacity: 0.85; margin-top: 4px; }
            .header .invoice-title { text-align: right; }
            .header .invoice-title h2 { font-size: 28px; font-weight: 300; letter-spacing: 3px; }
            .header .invoice-title p { font-size: 12px; opacity: 0.85; margin-top: 4px; }
            .body { padding: 30px 40px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; font-weight: 600; }
            .info-block p { margin: 3px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            thead th { background: #f8f9fa; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 2px solid #e0e0e0; text-align: left; }
            thead th:last-child, thead th:nth-child(5), thead th:nth-child(4) { text-align: right; }
            thead th:nth-child(3), thead th:nth-child(4) { text-align: center; }
            .total-section { display: flex; justify-content: flex-end; }
            .total-box { background: #f8f9fa; padding: 20px 30px; border-radius: 10px; min-width: 280px; }
            .total-box .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .total-box .grand { font-size: 20px; font-weight: 700; color: #ff6b35; border-top: 2px solid #ddd; padding-top: 12px; margin-top: 8px; }
            .footer { text-align: center; padding: 25px 40px; background: #fafafa; border-top: 1px solid #eee; font-size: 12px; color: #999; }
            .footer strong { color: #ff6b35; }
            @media print {
                body { padding: 0; }
                .invoice-box { border: none; border-radius: 0; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header">
                <div class="logo-area">
                    <img src="assets/img/Kaviya_crackers_logo.jpeg" alt="Logo">
                    <div>
                        <div class="shop-name">Kaviya Crackers</div>
                        <div class="shop-sub">Premium Fireworks & Festive Crackers</div>
                        <div class="shop-sub">📞 +91 93427 58753</div>
                    </div>
                </div>
                <div class="invoice-title">
                    <h2>INVOICE</h2>
                    <p>Order #${order.id.slice(-6).toUpperCase()}</p>
                    <p>${orderDate} | ${orderTime}</p>
                </div>
            </div>
            <div class="body">
                <div class="info-row">
                    <div class="info-block">
                        <h4>Bill To</h4>
                        <p><strong>${order.customer.name}</strong></p>
                        <p>${order.customer.phone}</p>
                        <p>${order.customer.email}</p>
                    </div>
                    <div class="info-block" style="text-align:right;">
                        <h4>Ship To</h4>
                        <p>${order.customer.address}</p>
                        <p>Pincode: ${order.customer.pincode}</p>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Product</th>
                            <th>Content</th>
                            <th>Qty</th>
                            <th style="text-align:right;">Rate</th>
                            <th style="text-align:right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                    </tbody>
                </table>
                <div class="total-section">
                    <div class="total-box">
                        <div class="row"><span>Subtotal:</span><span>₹${order.total}</span></div>
                        <div class="row grand"><span>Grand Total:</span><span>₹${order.total}</span></div>
                    </div>
                </div>
            </div>
            <div class="footer">
                <p>Thank you for choosing <strong>Kaviya Crackers</strong>! 🎆</p>
                <p style="margin-top:5px;">This is a computer-generated invoice. No signature required.</p>
            </div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
}

function deleteOrder(id) {
    if (confirm('Delete this order record?')) {
        orders = orders.filter(o => o.id !== id);
        localStorage.setItem('Kaviya_orders', JSON.stringify(orders));
        renderAdminOrders();
    }
}

// Initial check
checkAuth();
