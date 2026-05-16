let products = [];
let cart = {};

async function loadProducts() {
    try {
        const data = await apiFetchData();
        if (data && data.products) {
            products = data.products;
            
            // Auto-populate categories from products if needed, 
            // but better to use the categories list from DB
            if (data.categories) {
                renderCategoryFilter(data.categories);
            }
        }
        filterProducts();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderCategoryFilter(categories) {
    const select = document.getElementById('categoryFilter');
    if (!select) return;
    
    let html = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
        const name = typeof cat === 'string' ? cat : cat.name;
        html += `<option value="${name}">${name}</option>`;
    });
    select.innerHTML = html;
}

function renderTable(filteredProducts = products) {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = '';

    if (filteredProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-muted">No products found matching your search.</td></tr>';
        return;
    }

    const categories = [...new Set(filteredProducts.map(p => p.category))];
    let sNo = 1;

    categories.forEach(category => {
        // Category Header
        const catRow = document.createElement('tr');
        catRow.className = 'category-row';
        catRow.innerHTML = `<td colspan="6" class="py-3 ps-4 fs-5">${category}</td>`;
        tableBody.appendChild(catRow);

        // Category Products
        const catProducts = filteredProducts.filter(p => p.category === category);
        catProducts.forEach(product => {
            const row = document.createElement('tr');
            const qty = cart[product.id] || '';
            const total = qty ? qty * product.rate : 0;

            const originalRate = product.originalRate || Math.round(product.rate * 1.4);
            const discount = Math.round(((originalRate - product.rate) / originalRate) * 100);

            row.innerHTML = `
                <td class="text-center col-img">
                    <img src="${safeMediaSrc(product.image)}" alt="${product.name}" class="rounded-2 shadow-sm" 
                        onerror="this.src='assets/img/Kaviya_crackers_logo.jpeg'"
                        style="width: 40px; height: 40px; object-fit: cover; border: 1px solid #eee;">
                </td>
                <td class="ps-1">
                    <div class="fw-bold text-dark lh-sm" style="font-size: 0.85rem;">${product.name}</div>
                    <div class="text-muted" style="font-size: 0.65rem;">${product.content}</div>
                </td>
                <td class="text-center col-rate">
                    <div class="original-price">₹${originalRate}</div>
                    <div class="offer-price discount-badge">₹${product.rate} </div>
                </td>
                <td class="text-center col-qty">
                    ${qty > 0 ? `
                        <div class="qty-toggle-container mx-auto">
                            <button class="qty-btn" onclick="updateQty(${product.id}, ${qty - 1})">-</button>
                            <div class="qty-count">${qty}</div>
                            <button class="qty-btn" onclick="updateQty(${product.id}, ${qty + 1})">+</button>
                        </div>
                    ` : `
                        <button class="add-btn mx-auto" onclick="updateQty(${product.id}, 1)">ADD</button>
                    `}
                </td>
                <td class="text-end pe-2 fw-bold text-primary col-total" style="font-size: 0.85rem;">₹<span id="total-${product.id}">${total}</span></td>
            `;
            tableBody.appendChild(row);
        });
    });
}

function updateQty(id, value) {
    const qty = Math.max(0, parseInt(value) || 0);
    if (qty > 0) {
        cart[id] = qty;
    } else {
        delete cart[id];
    }
    localStorage.setItem('Kaviya_cart', JSON.stringify(cart));

    // Full re-render to update the ADD button vs +/- toggle
    filterProducts();
    calculateGrandTotal();
}

function calculateGrandTotal() {
    let grandTotal = 0;
    let itemCount = 0;
    for (const id in cart) {
        const product = products.find(p => p.id == id);
        if (product) {
            grandTotal += cart[id] * product.rate;
            itemCount += cart[id];
        }
    }

    document.getElementById('floatingTotal').innerText = grandTotal;
    document.getElementById('mobileTotal').innerText = grandTotal;

    // Minimum Order Logic (₹3000)
    const canCheckout = grandTotal >= 3000;
    const sendButtons = document.querySelectorAll('[onclick="sendWhatsAppEnquiry()"]');
    const minOrderNotice = document.getElementById('minOrderNotice');
    const mobileMinOrderNotice = document.getElementById('mobileMinOrderNotice');

    sendButtons.forEach(btn => {
        btn.disabled = !canCheckout;
        btn.style.opacity = canCheckout ? '1' : '0.5';
        btn.style.cursor = canCheckout ? 'pointer' : 'not-allowed';
    });

    if (minOrderNotice) {
        minOrderNotice.style.display = (grandTotal > 0 && !canCheckout) ? 'block' : 'none';
        if (grandTotal > 0 && !canCheckout) {
            minOrderNotice.innerHTML = `<i class="bi bi-info-circle me-1"></i> Minimum ₹3000 required. Add ₹${3000 - grandTotal} more.`;
        }
    }
    
    if (mobileMinOrderNotice) {
        mobileMinOrderNotice.style.display = (grandTotal > 0 && !canCheckout) ? 'block' : 'none';
        if (grandTotal > 0 && !canCheckout) {
            mobileMinOrderNotice.innerHTML = `Min ₹3000 required (₹${3000 - grandTotal} to go)`;
        }
    }

    // Update header cart count
    const headerCount = document.getElementById('headerCartCount');
    if (headerCount) {
        headerCount.innerText = itemCount;
        headerCount.style.display = itemCount > 0 ? 'inline-block' : 'none';
    }
}

function sendWhatsAppEnquiry() {
    if (Object.keys(cart).length === 0) {
        alert('Please add at least one item to your enquiry.');
        return;
    }

    // Calculate total for modal display
    let grandTotal = 0;
    for (const id in cart) {
        const product = products.find(p => p.id == id);
        if (product) grandTotal += cart[id] * product.rate;
    }

    document.getElementById('modalTotal').innerText = grandTotal;
    const modal = new bootstrap.Modal(document.getElementById('enquiryModal'));
    modal.show();
}

// Enquiry Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const enquiryForm = document.getElementById('enquiryForm');
    if (enquiryForm) {
        enquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('custName').value.trim();
            const phone = document.getElementById('custPhone').value.trim();
            const email = document.getElementById('custEmail').value.trim();
            const address = document.getElementById('custAddress').value.trim();
            const pincode = document.getElementById('custPincode').value.trim();

            // Build order items
            let items = [];
            let grandTotal = 0;
            for (const id in cart) {
                const product = products.find(p => p.id == id);
                if (product) {
                    const qty = cart[id];
                    items.push({
                        id: product.id,
                        name: product.name,
                        content: product.content,
                        rate: product.rate,
                        qty: qty
                    });
                    grandTotal += qty * product.rate;
                }
            }

            const order = {
                id: 'ORD' + Date.now(),
                customer: customerData,
                items: cartItems,
                total: grandTotal,
                date: new Date().toISOString(),
                status: 'Pending'
            };

            // Sync with Server
            const result = await apiCreateOrder(order);
            
            if (result.success) {
                // Show success modal
                bootstrap.Modal.getInstance(document.getElementById('enquiryModal')).hide();
                enquiryForm.reset();
                
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                successModal.show();

                // Clear cart
                cart = {};
                updateCartUI();
                localStorage.removeItem('Kaviya_cart');

                // Add WhatsApp redirect button to success modal
                const whatsappBtn = document.createElement('button');
                whatsappBtn.className = 'btn btn-success rounded-pill mt-3 w-100';
                whatsappBtn.innerHTML = '<i class="bi bi-whatsapp me-2"></i> Send to WhatsApp';
                whatsappBtn.onclick = () => {
                    const message = encodeURIComponent(`New Order ${order.id}\nCustomer: ${order.customer.name}\nTotal: ₹${order.total}\nPlease confirm my order!`);
                    window.open(`https://wa.me/919342758753?text=${message}`, '_blank');
                };
                document.querySelector('#successModal .modal-body').appendChild(whatsappBtn);
            } else {
                alert('Failed to place order. Please try again.');
            }

            // Close enquiry modal, show success modal
            bootstrap.Modal.getInstance(document.getElementById('enquiryModal')).hide();
            enquiryForm.reset();

            setTimeout(() => {
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                successModal.show();
            }, 400);

            // Reset cart
            cart = {};
            localStorage.removeItem('Kaviya_cart');
            calculateGrandTotal();
            renderTable(products.filter(p => p.active !== false));
        });
    }
});

function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'all' || p.category === category;
        const isActive = p.active !== false;
        return matchesSearch && matchesCategory && isActive;
    });

    renderTable(filtered);
}

// Load dynamic categories for the filter dropdown
function loadCategoryFilter() {
    const stored = localStorage.getItem('Kaviya_categories');
    if (stored) {
        const parsed = JSON.parse(stored);
        const select = document.getElementById('categoryFilter');
        if (select) {
            select.innerHTML = '<option value="all">All Categories</option>';
            parsed.forEach(cat => {
                const name = typeof cat === 'string' ? cat : cat.name;
                select.innerHTML += `<option value="${name}">${name}</option>`;
            });
        }
    }
}

// Initialize
window.onload = () => {
    loadProducts();
};
