import React, { useState, useEffect, useMemo } from 'react';
import { useApi, api } from '../hooks/useApi';
import logo from '../assets/img/kaviya_crackers_logo.jpeg';
import logoBackground from '../img/logo-background.png';
import enquiryLogo from '../assets/img/kaviya-crackers-logo.jpeg';
import { Link } from 'react-router-dom';
import BillingSection from '../components/BillingSection';
import { getImageUrl } from '../utils/imageUtils';

const Admin = () => {
  const { fetchData, login, updateOrderStatus } = useApi();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [orderTab, setOrderTab] = useState('online');

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const isStoreBill = order.cancellationNote && (
        order.cancellationNote.includes('Billing Panel') || 
        order.cancellationNote.includes('Estimate invoice')
      );
      if (orderTab === 'billing') {
        return isStoreBill;
      } else {
        return !isStoreBill;
      }
    });
  }, [orders, orderTab]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [settings, setSettings] = useState({ phone: '', whatsapp: '', email: '', address: '' });
  const [settingsSaveStatus, setSettingsSaveStatus] = useState(null);

  // Admin user management state
  const [admins, setAdmins] = useState([]);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [selectedAdminToReset, setSelectedAdminToReset] = useState('');
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [adminActionError, setAdminActionError] = useState('');
  const [adminActionSuccess, setAdminActionSuccess] = useState('');

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newProduct, setNewProduct] = useState({ 
    name: '', category: '', content: '', rate: '', originalRate: '', image: '', active: true 
  });
  const [newCategory, setNewCategory] = useState({ name: '', image: '' });

  // Group products by category (same as frontend Shop page)
  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [products]);

  const orderedCategoryNames = useMemo(() => {
    const presentCats = Object.keys(groupedProducts);
    const categoryOrderMap = new Map();
    categories.forEach((cat, index) => {
      categoryOrderMap.set(typeof cat === 'string' ? cat : cat.name, index);
    });

    return presentCats.sort((a, b) => {
      const orderA = categoryOrderMap.has(a) ? categoryOrderMap.get(a) : 9999;
      const orderB = categoryOrderMap.has(b) ? categoryOrderMap.get(b) : 9999;
      return orderA - orderB;
    });
  }, [groupedProducts, categories]);

  const [catalogSearch, setCatalogSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  const toggleCategoryCollapse = (catName) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  };

  const handleToggleCollapseAll = () => {
    if (collapsedCategories.size === categories.length) {
      setCollapsedCategories(new Set());
    } else {
      setCollapsedCategories(new Set(categories.map(c => typeof c === 'string' ? c : c.name)));
    }
  };

  const openAddProductForCategory = (categoryName) => {
    setEditingProduct(null);
    setNewProduct({
      name: '',
      category: categoryName || (categories[0]?.name || ''),
      content: '',
      rate: '',
      originalRate: '',
      image: '',
      active: true
    });
    setShowProductModal(true);
  };

  const uncategorizedProducts = useMemo(() => {
    const categoryNameSet = new Set(categories.map(c => typeof c === 'string' ? c : c.name));
    return products.filter(p => !categoryNameSet.has(p.category));
  }, [products, categories]);

  const filteredCategories = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(cat => {
      const catName = typeof cat === 'string' ? cat : cat.name;
      if (catName.toLowerCase().includes(q)) return true;
      const catProds = groupedProducts[catName] || [];
      return catProds.some(p => 
        p.name.toLowerCase().includes(q) || 
        (p.content && p.content.toLowerCase().includes(q))
      );
    });
  }, [categories, catalogSearch, groupedProducts]);

  // Move product up or down within its category group
  const handleMoveProduct = async (product, direction) => {
    const prodMatchId = (p) => (p._id ? String(p._id) : String(p.id));
    const targetId = prodMatchId(product);

    const catProducts = [...(groupedProducts[product.category] || [])];
    const idx = catProducts.findIndex(p => prodMatchId(p) === targetId);
    if (idx < 0) return;
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= catProducts.length) return;

    // Swap in the category group
    [catProducts[idx], catProducts[swapIdx]] = [catProducts[swapIdx], catProducts[idx]];

    // Rebuild the full products array preserving other categories' order
    const newProducts = [];
    const visited = new Set();
    products.forEach(p => {
      if (p.category === product.category) {
        if (!visited.has(p.category)) {
          visited.add(p.category);
          newProducts.push(...catProducts);
        }
      } else {
        newProducts.push(p);
      }
    });

    setProducts(newProducts);

    try {
      await api.post('/data', { products: newProducts });
      loadData();
    } catch (err) {
      alert('Failed to reorder product');
      loadData();
    }
  };

  // Move category up or down in the list
  const handleMoveCategory = async (index, direction) => {
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const newCategories = [...categories];
    [newCategories[index], newCategories[swapIdx]] = [newCategories[swapIdx], newCategories[index]];
    setCategories(newCategories);

    // Keep products array grouped in the new category order
    const categoryOrderMap = new Map();
    newCategories.forEach((c, idx) => {
      const name = typeof c === 'string' ? c : c.name;
      categoryOrderMap.set(name, idx);
    });

    const catGroups = {};
    const uncategorized = [];
    products.forEach(p => {
      if (categoryOrderMap.has(p.category)) {
        if (!catGroups[p.category]) catGroups[p.category] = [];
        catGroups[p.category].push(p);
      } else {
        uncategorized.push(p);
      }
    });

    const newProducts = [];
    newCategories.forEach(c => {
      const name = typeof c === 'string' ? c : c.name;
      if (catGroups[name]) {
        newProducts.push(...catGroups[name]);
      }
    });
    newProducts.push(...uncategorized);
    setProducts(newProducts);

    try {
      await api.post('/data', { categories: newCategories, products: newProducts });
      loadData();
    } catch (err) {
      alert('Failed to reorder category');
      loadData();
    }
  };

  const [reportType, setReportType] = useState('weekly'); // 'weekly', 'monthly', 'yearly'

  const getReportData = (type) => {
    const data = [];
    const now = new Date();

    if (type === 'weekly') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        data.push({
          date: d,
          label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
          dateStr: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          total: 0,
          ordersCount: 0
        });
      }

      orders.forEach(order => {
        if (order.status !== 'Cancelled') {
          const orderDate = new Date(order.date);
          const match = data.find(item => 
            item.date.getDate() === orderDate.getDate() &&
            item.date.getMonth() === orderDate.getMonth() &&
            item.date.getFullYear() === orderDate.getFullYear()
          );
          if (match) {
            match.total += (order.totalAmount || 0);
            match.ordersCount += 1;
          }
        }
      });
    } else if (type === 'monthly') {
      // Last 30 days (grouped in 4 weeks for beautiful visual bar presentation)
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i + 1) * 7 + 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date();
        end.setDate(now.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);
        
        data.push({
          start,
          end,
          label: i === 0 ? 'This Week' : `Week -${i}`,
          dateStr: `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
          total: 0,
          ordersCount: 0
        });
      }

      orders.forEach(order => {
        if (order.status !== 'Cancelled') {
          const orderDate = new Date(order.date);
          const match = data.find(item => orderDate >= item.start && orderDate <= item.end);
          if (match) {
            match.total += (order.totalAmount || 0);
            match.ordersCount += 1;
          }
        }
      });
    } else if (type === 'yearly') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        data.push({
          month: d.getMonth(),
          year: d.getFullYear(),
          label: d.toLocaleDateString('en-IN', { month: 'short' }),
          dateStr: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          total: 0,
          ordersCount: 0
        });
      }

      orders.forEach(order => {
        if (order.status !== 'Cancelled') {
          const orderDate = new Date(order.date);
          const match = data.find(item => 
            item.month === orderDate.getMonth() &&
            item.year === orderDate.getFullYear()
          );
          if (match) {
            match.total += (order.totalAmount || 0);
            match.ordersCount += 1;
          }
        }
      });
    }

    const maxSales = Math.max(...data.map(d => d.total), 1);
    return { data, maxSales };
  };

  const loadAdmins = async () => {
    try {
      const response = await api.get('/admins');
      if (response.data && response.data.success) {
        setAdmins(response.data.admins || []);
      }
    } catch (err) {
      console.error('Failed to load admins', err);
    }
  };

  const clearAdminSession = () => {
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_username');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const validateStoredSession = async () => {
      const storedUsername = sessionStorage.getItem('admin_username');
      if (sessionStorage.getItem('admin_auth') !== 'true' || !storedUsername) {
        clearAdminSession();
        return;
      }

      try {
        await api.get(`/admins/session/${encodeURIComponent(storedUsername)}`);
        setIsAuthenticated(true);
        loadData();
        loadAdmins();
      } catch (err) {
        clearAdminSession();
      }
    };

    validateStoredSession();
  }, []);

  const loadData = async () => {
    const data = await fetchData();
    if (data) {
      setOrders(data.orders || []);
      setProducts(data.products || []);
      setCategories(data.categories || []);
      if (data.settings) setSettings(data.settings);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaveStatus('saving');
    try {
      await api.post('/data', { settings });
      setSettingsSaveStatus('success');
      setTimeout(() => setSettingsSaveStatus(null), 3000);
      loadData();
    } catch (err) {
      setSettingsSaveStatus('error');
      setTimeout(() => setSettingsSaveStatus(null), 3000);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await loadData();
    await loadAdmins();
    setTimeout(() => setIsSyncing(false), 800); // Small delay for UX feel
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await login(username, password);
    if (res.success) {
      sessionStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_username', res.username || username);
      setIsAuthenticated(true);
      loadData();
      loadAdmins();
    } else {
      alert(res.message);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminActionError('');
    setAdminActionSuccess('');

    if (!newAdminUser.trim() || !newAdminPassword) {
      setAdminActionError('Username and password are required.');
      return;
    }

    if (!/^\d+$/.test(newAdminPassword)) {
      setAdminActionError('Password must contain only numbers.');
      return;
    }

    try {
      const res = await api.post('/admins', {
        username: newAdminUser.trim(),
        password: newAdminPassword
      });
      if (res.data && res.data.success) {
        setAdminActionSuccess('Admin user created successfully!');
        setNewAdminUser('');
        setNewAdminPassword('');
        loadAdmins();
      } else {
        setAdminActionError(res.data.message || 'Failed to create admin.');
      }
    } catch (err) {
      setAdminActionError(err.response?.data?.message || 'Server error creating admin.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAdminActionError('');
    setAdminActionSuccess('');

    if (!selectedAdminToReset) {
      setAdminActionError('Please select an admin user.');
      return;
    }

    if (!resetPasswordVal) {
      setAdminActionError('New password is required.');
      return;
    }

    if (!/^\d+$/.test(resetPasswordVal)) {
      setAdminActionError('Password must contain only numbers.');
      return;
    }

    try {
      const res = await api.post('/admins/reset-password', {
        username: selectedAdminToReset,
        newPassword: resetPasswordVal
      });
      if (res.data && res.data.success) {
        setAdminActionSuccess(`Password for "${selectedAdminToReset}" reset successfully!`);
        setResetPasswordVal('');
        setSelectedAdminToReset('');
      } else {
        setAdminActionError(res.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setAdminActionError(err.response?.data?.message || 'Server error resetting password.');
    }
  };

  const handleDeleteAdmin = async (usernameToDelete) => {
    if (!window.confirm(`Are you sure you want to delete admin "${usernameToDelete}"?`)) {
      return;
    }
    setAdminActionError('');
    setAdminActionSuccess('');

    try {
      const res = await api.delete(`/admins/${usernameToDelete}`);
      if (res.data && res.data.success) {
        setAdminActionSuccess(`Admin "${usernameToDelete}" deleted successfully.`);
        if (sessionStorage.getItem('admin_username') === usernameToDelete) {
          clearAdminSession();
          return;
        }
        loadAdmins();
      } else {
        setAdminActionError(res.data.message || 'Failed to delete admin.');
      }
    } catch (err) {
      setAdminActionError(err.response?.data?.message || 'Server error deleting admin.');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    let cancellationNote = '';
    if (status === 'Cancelled') {
      const note = window.prompt("Please enter a note/reason for cancelling this order:");
      if (note === null) return; // User cancelled the prompt
      cancellationNote = note.trim();
    }

    const res = await updateOrderStatus(id, status, cancellationNote);
    if (res.success) {
      setOrders(orders.map(o => o._id === id ? { ...o, status, cancellationNote } : o));
      loadData();
    }
  };

  const handleEditNote = async (order) => {
    const note = window.prompt("Edit cancellation note:", order.cancellationNote || "");
    if (note !== null) {
      const res = await updateOrderStatus(order._id, order.status, note.trim());
      if (res.success) {
        setOrders(orders.map(o => o._id === order._id ? { ...o, cancellationNote: note.trim() } : o));
      }
    }
  };

  const handleRemoveNote = async (order) => {
    if (window.confirm("Are you sure you want to remove the cancellation note?")) {
      const res = await updateOrderStatus(order._id, order.status, "");
      if (res.success) {
        setOrders(orders.map(o => o._id === order._id ? { ...o, cancellationNote: "" } : o));
      }
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this enquiry?")) {
      try {
        const res = await api.delete(`/orders/${id}`);
        if (res.data && res.data.success) {
          setOrders(orders.filter(o => o._id !== id));
          loadData();
        } else {
          alert(res.data?.message || "Failed to delete enquiry");
        }
      } catch (err) {
        console.error("Delete enquiry error:", err);
        alert("Failed to delete enquiry");
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const nextProducts = products.filter((p) => String(p._id) !== String(id) && String(p.id) !== String(id));
        setProducts(nextProducts);
        await api.post('/data', { products: nextProducts });
        loadData();
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  const handleToggleProductActive = async (product) => {
    const prodMatchId = (p) => (p._id ? String(p._id) : String(p.id));
    const targetId = prodMatchId(product);
    const updatedActive = !(product.active !== false);
    const updatedProducts = products.map((p) =>
      prodMatchId(p) === targetId ? { ...p, active: updatedActive } : p
    );
    setProducts(updatedProducts);
    try {
      await api.post('/data', { products: updatedProducts });
    } catch (err) {
      console.error("Failed to toggle product status:", err);
      alert("Failed to update product status");
      loadData();
    }
  };

  // Helper: insert a product at the end of its category group in the products array
  const insertProductAtEndOfCategory = (currentProducts, newProd, categoriesList) => {
    // 1. Find the last index of any existing product in this category
    let lastCatIndex = -1;
    for (let i = 0; i < currentProducts.length; i++) {
      if (currentProducts[i].category === newProd.category) {
        lastCatIndex = i;
      }
    }

    if (lastCatIndex !== -1) {
      // Insert right after the last product in this category
      const copy = [...currentProducts];
      copy.splice(lastCatIndex + 1, 0, newProd);
      return copy;
    }

    // 2. If no product exists in this category yet, place it according to categories sequence
    const catName = newProd.category;
    const catIndex = categoriesList.findIndex(c => (typeof c === 'string' ? c : c.name) === catName);

    if (catIndex > 0) {
      // Look backward for previous category in categories list that has products
      for (let c = catIndex - 1; c >= 0; c--) {
        const prevCatName = typeof categoriesList[c] === 'string' ? categoriesList[c] : categoriesList[c].name;
        let lastPrevIndex = -1;
        for (let i = 0; i < currentProducts.length; i++) {
          if (currentProducts[i].category === prevCatName) {
            lastPrevIndex = i;
          }
        }
        if (lastPrevIndex !== -1) {
          const copy = [...currentProducts];
          copy.splice(lastPrevIndex + 1, 0, newProd);
          return copy;
        }
      }
    }

    // 3. Fallback: append at the end
    return [...currentProducts, newProd];
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
        active: newProduct.active !== false,
      };

      let nextProducts;
      if (editingProduct) {
        const prodMatchId = (p) => (p._id ? String(p._id) : String(p.id));
        const editTargetId = editingProduct._id ? String(editingProduct._id) : String(editingProduct.id);

        if (editingProduct.category !== newProduct.category) {
          // Category changed: remove from old position, insert at the end of the new category
          const remaining = products.filter((p) => prodMatchId(p) !== editTargetId);
          const updatedProd = { ...editingProduct, ...payload };
          nextProducts = insertProductAtEndOfCategory(remaining, updatedProd, categories);
        } else {
          // Same category: update in place to preserve current custom order
          nextProducts = products.map((p) =>
            prodMatchId(p) === editTargetId ? { ...p, ...payload, id: p.id } : p
          );
        }
      } else {
        // Adding NEW product: always append to the LAST position of its category
        const maxId = products.length ? Math.max(...products.map((p) => p.id || 0), 0) : 0;
        const newProdItem = {
          id: maxId + 1,
          _id: 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          ...payload
        };
        nextProducts = insertProductAtEndOfCategory(products, newProdItem, categories);
      }

      setProducts(nextProducts);
      await api.post('/data', { products: nextProducts });
      setShowProductModal(false);
      setEditingProduct(null);
      setNewProduct({ name: '', category: '', content: '', rate: '', originalRate: '', image: '', active: true });
      loadData();
    } catch (err) {
      console.error("Failed to save product:", err);
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
      image: p.image,
      active: p.active !== false
    });
    setShowProductModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      let nextCategories;
      let nextProducts = products;
      if (editingCategory) {
        const catMatchId = (c) => (c._id ? String(c._id) : c.name);
        const targetId = editingCategory._id ? String(editingCategory._id) : editingCategory.name;
        const oldName = typeof editingCategory === 'string' ? editingCategory : editingCategory.name;
        const newName = newCategory.name.trim();

        nextCategories = categories.map((c) =>
          catMatchId(c) === targetId
            ? { ...c, name: newName, image: newCategory.image || '' }
            : c
        );

        // If category was renamed, update all associated products so they keep their category
        if (oldName !== newName) {
          nextProducts = products.map(p => p.category === oldName ? { ...p, category: newName } : p);
          setProducts(nextProducts);
        }
      } else {
        // ALWAYS append new category to the LAST position of categories
        const newCatItem = {
          name: newCategory.name.trim(),
          image: newCategory.image || '',
          link: 'shop.html',
        };
        nextCategories = [...categories, newCatItem];
      }

      setCategories(nextCategories);

      if (editingCategory && (editingCategory.name !== newCategory.name.trim())) {
        await api.post('/data', { categories: nextCategories, products: nextProducts });
      } else {
        await api.post('/data', { categories: nextCategories });
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      setNewCategory({ name: '', image: '' });
      loadData();
    } catch (err) {
      console.error("Failed to save category:", err);
      alert("Failed to save category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category? This might affect products in this category.")) {
      try {
        const nextCategories = categories.filter((c) => String(c._id) !== String(id) && c.name !== id);
        setCategories(nextCategories);
        await api.post('/data', { categories: nextCategories });
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

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const endpoint = type === 'product' ? '/upload-product' : '/upload-category';
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        if (type === 'product') {
          setNewProduct(prev => ({ ...prev, image: res.data.path }));
        } else {
          setNewCategory(prev => ({ ...prev, image: res.data.path }));
        }
      } else {
        alert(res.data?.message || "Image upload failed");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      alert(err.response?.data?.message || err.message || "Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };



  const handleDownloadInvoice = async (order) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site to print invoices.');
      return;
    }

    const getAbsoluteUrl = (path) => {
      if (!path) return '';
      if (path.startsWith('http') || path.startsWith('data:')) return path;
      const normalizedPath = path.startsWith('/') ? path : '/' + path;
      return `${window.location.origin}${normalizedPath}`;
    };

    const cancellation = order.cancellationNote || '';
    const isFromBillingPanel = cancellation.includes('Billing Panel');

    const invoiceDate = new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const invoiceNo = `KAV-${String(order._id).slice(-6).toUpperCase()}`;
    const items = order.items || [];

    if (isFromBillingPanel) {
      const logoUrl = getAbsoluteUrl(logo);
      const logoBackgroundUrl = getAbsoluteUrl(logoBackground);

      let parsedDate = new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

      const isInvoice = cancellation.includes('INV') || cancellation.includes('Invoice');
      const docTitleLabel = isInvoice ? 'Tax Invoice' : 'Estimate';
      const docNoLabel = isInvoice ? 'Invoice No.' : 'Estimate No.';
      const docNo = cancellation.split(':').pop().trim();

      const subtotal = order.subtotalAmount || items.reduce((sum, item) => sum + ((item.originalRate || item.rate || 0) * (item.quantity || 0)), 0);
      const totalAmount = order.totalAmount || 0;
      const discountAmount = order.discountAmount !== undefined ? order.discountAmount : Math.max(0, subtotal - totalAmount);
      const discountPercent = order.discountPercent !== undefined ? order.discountPercent : (subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0);
      const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

      const paddingCount = Math.max(0, 11 - items.length);
      let paddingRowsHtml = '';
      for (let i = 0; i < paddingCount; i++) {
        paddingRowsHtml +=
          '<tr style="height: 35px;">' +
          '<td style="border-right:2px solid #000;border-bottom:1.5px solid #000;"></td>' +
          '<td style="border-right:2px solid #000;border-bottom:1.5px solid #000;"></td>' +
          '<td style="border-right:2px solid #000;border-bottom:1.5px solid #000;"></td>' +
          '<td style="border-right:2px solid #000;border-bottom:1.5px solid #000;"></td>' +
          '<td style="border-bottom:1.5px solid #000;"></td></tr>';
      }

      const numberToWords = (num) => {
        if (num === 0) return 'Zero Rupees Only';
        const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
        const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
        const g = (n) => n < 20 ? a[n] : b[Math.floor(n/10)] + (n%10 ? ' ' + a[n%10] : '');
        const h = (n) => n < 100 ? g(n) : a[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' and ' + g(n%100) : '');
        const handle = (n, l) => n ? h(n) + ' ' + l + ' ' : '';
        let rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);
        let str = '';
        str += handle(Math.floor(rupees/10000000), 'Crore'); rupees %= 10000000;
        str += handle(Math.floor(rupees/100000), 'Lakh'); rupees %= 100000;
        str += handle(Math.floor(rupees/1000), 'Thousand'); rupees %= 1000;
        str += handle(rupees, '');
        str = str.trim() + ' Rupees';
        if (paise > 0) str += ' and ' + g(paise) + ' Paise';
        return str + ' Only';
      };

      const companyNameText = settings?.companyName || 'KAVIYA CRACKERS';
      const companyAddressText = settings?.address || '3/574, Sivakasi to Sattur Main Road, Near Anuupankulam Bus Stop, Sivakasi - 626189, Virudhunagar (Dt.), Tamil Nadu.';
      const companyPhoneText = settings?.phone || '8248361625';

      const htmlContent =
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + docTitleLabel + ' - ' + docNo + '</title><style>' +
        '*{margin:0;padding:0;box-sizing:border-box;}' +
        'body{font-family:Arial,sans-serif;color:#000;background:transparent;padding:20px;font-size:10pt;position:relative;}' +
        '.print-master-table{width:100%;max-width:800px;margin:0 auto;border-collapse:collapse;border:2.5px solid #000;background:transparent;position:relative;z-index:2;}' +
        '.bill-sheet{width:100%;max-width:800px;margin:0 auto;background:transparent;}' +
        '.row-flex{display:flex;}.border-bottom-black{border-bottom:2px solid #000;}.border-right-black{border-right:2px solid #000;}' +
        '.header-logo{width:25%;display:flex;align-items:center;justify-content:center;min-height:120px;}' +
        '.header-logo-box{width:85px;height:85px;border:1.5px solid #000;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background-color:#fff;}' +
        '.logo-img{width:100%;height:100%;object-fit:contain;}' +
        '.header-details{width:75%;padding:12px;text-align:center;}' +
        '.header-details h1{font-size:19pt;font-weight:bold;text-transform:uppercase;margin-bottom:4px;letter-spacing:0.5px;}' +
        '.header-details p{font-size:9pt;color:#111;line-height:1.4;margin-bottom:2px;}' +
        '.buyer-box{width:60%;padding:12px;text-align:left;}' +
        '.meta-box{width:40%;padding:12px;text-align:left;}' +
        '.box-title{font-weight:bold;border-bottom:1.5px solid #000;padding-bottom:2px;margin-bottom:8px;text-transform:uppercase;font-size:8.5pt;color:#333;}' +
        '.meta-row{display:flex;align-items:center;margin-bottom:6px;}' +
        '.meta-label{font-weight:bold;width:110px;font-size:9.5pt;}' +
        '.product-table{width:100%;border-collapse:collapse;}' +
        '.product-table th{border-right:2px solid #000;border-bottom:2px solid #000;padding:8px;font-weight:bold;text-transform:uppercase;font-size:8.5pt;text-align:center;}' +
        '.product-table td{border-right:2px solid #000;border-bottom:1.5px solid #000;padding:6px 8px;vertical-align:top;font-size:9.5pt;}' +
        '.product-table th:last-child,.product-table td:last-child{border-right:none;}' +
        '.text-center{text-align:center;}.text-end{text-align:right;}.font-monospace{font-family:monospace;}' +
        '.totals-row td{border-top:2px solid #000;border-bottom:2px solid #000;font-weight:bold;padding:8px;}' +
        '.amount-in-words-row td{padding:12px;}' +
        '.declaration-box{width:60%;padding:12px;font-size:8pt;line-height:1.4;}' +
        '.signatory-box{padding:12px;display:flex;flex-direction:column;justify-content:space-between;text-align:right;}' +
        '.footer-note{text-align:center;font-weight:bold;margin-top:15px;font-size:9pt;}' +
        '@media print{body{padding:0;}@page{size:A4 portrait;margin:1cm;}.d-print-none{display:none!important;}thead{display:table-header-group;}tbody{display:table-row-group;}}' +
        '.watermark-container{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;opacity:0.15;pointer-events:none;z-index:1;display:flex;align-items:center;justify-content:center;}' +
        '.watermark-img{width:100%;height:100%;object-fit:contain;}' +
        '</style></head><body>' +
        '<div class="watermark-container"><img src="' + logoBackgroundUrl + '" class="watermark-img" /></div>' +
        '<div style="max-width:800px;margin:0 auto;"><table class="print-master-table"><thead><tr><td style="padding:0;border-bottom:2px solid #000;"><div class="bill-sheet">' +
        '<div class="text-center border-bottom-black py-1 fw-bold text-uppercase tracking-wider" style="font-size:11pt;">' + docTitleLabel + '</div>' +
        '<div class="row-flex align-items-center"><div class="header-logo border-right-black"><div class="header-logo-box"><img src="' + logoUrl + '" class="logo-img" /></div></div>' +
        '<div class="header-details"><h1>' + companyNameText + '</h1><p>' + companyAddressText + '</p><p style="font-weight:bold;margin-top:2px;">Ph: ' + companyPhoneText + '</p></div></div></div></td></tr></thead><tbody><tr><td style="padding:0;"><div class="bill-sheet">' +
        '<div class="row-flex border-bottom-black" style="min-height:115px;"><div class="buyer-box border-right-black"><div class="box-title">Buyer</div>' +
        '<p style="font-weight:bold;font-size:10pt;margin-bottom:2px;">' + (order.customerName || 'In-Store Cash Customer') + '</p>' +
        '<p style="font-size:9pt;color:#222;line-height:1.4;white-space:pre-line;">' + (order.customerAddress || '') + '</p>' +
        (order.customerPhone ? '<p style="font-size:9pt;margin-top:4px;font-weight:500;">Ph: ' + order.customerPhone + '</p>' : '') + '</div>' +
        '<div class="meta-box"><div class="meta-row"><span class="meta-label">' + docNoLabel + '</span><span style="font-weight:bold;">: ' + docNo + '</span></div>' +
        '<div class="meta-row"><span class="meta-label">Dated</span><span>: ' + parsedDate + '</span></div></div></div>' +
        '<table class="product-table" style="width:100%;border-collapse:collapse;border-bottom:none;"><thead><tr class="text-center">' +
        '<th style="width:50px;">S.No</th><th>Products</th><th style="width:100px;">Qty</th><th style="width:120px;">Rate</th><th style="width:140px;">Amount</th></tr></thead><tbody>' +
        items.map((item, idx) =>
          '<tr><td class="text-center" style="font-weight:bold;color:#555;border-right:2px solid #000;border-bottom:1.5px solid #000;">' + (idx+1) + '</td>' +
          '<td style="border-right:2px solid #000;border-bottom:1.5px solid #000;"><div style="font-weight:bold;">' + (item.name || 'Product') + '</div>' +
          (item.content ? '<div style="font-size:8pt;color:#555;font-style:italic;margin-top:2px;">' + item.content + (item.category ? ' (' + item.category + ')' : '') + '</div>' : '') + '</td>' +
          '<td class="text-center" style="border-right:2px solid #000;border-bottom:1.5px solid #000;">' + (item.quantity || 0) + ' box</td>' +
          '<td class="text-end font-monospace" style="border-right:2px solid #000;border-bottom:1.5px solid #000;">₹' + (item.originalRate || item.rate || 0).toFixed(2) + '</td>' +
          '<td class="text-end font-monospace" style="font-weight:bold;border-bottom:1.5px solid #000;">₹' + ((item.originalRate || item.rate || 0) * (item.quantity || 0)).toFixed(2) + '</td></tr>'
        ).join('') + paddingRowsHtml +
        '</tbody></table>' +
        '<table class="totals-and-declaration-table" style="width:100%;border-collapse:collapse;page-break-inside:avoid;break-inside:avoid;border-top:none;"><tbody>' +
        '<tr class="totals-row"><td style="width:55%;border-right:2px solid #000;border-bottom:2px solid #000;text-align:right;font-weight:bold;padding:8px;">Total</td>' +
        '<td style="width:15%;border-right:2px solid #000;border-bottom:2px solid #000;text-align:center;font-weight:bold;padding:8px;">' + totalQty + '</td>' +
        '<td style="width:15%;border-right:2px solid #000;border-bottom:2px solid #000;text-align:right;font-weight:bold;padding:8px;">Sub total</td>' +
        '<td style="width:15%;border-bottom:2px solid #000;text-align:right;font-weight:bold;padding:8px;" class="font-monospace">₹' + subtotal.toFixed(2) + '</td></tr>' +
        '<tr><td colSpan="3" style="border-right:2px solid #000;border-bottom:1.5px solid #000;text-align:right;font-weight:bold;padding:6px 8px;">Discount (' + discountPercent + '%)</td>' +
        '<td style="border-bottom:1.5px solid #000;text-align:right;color:#d9534f;font-weight:bold;padding:6px 8px;" class="font-monospace">-₹' + discountAmount.toFixed(2) + '</td></tr>' +
        '<tr><td colSpan="3" style="border-right:2px solid #000;border-bottom:1.5px solid #000;text-align:right;font-weight:bold;padding:6px 8px;">Discounted Total</td>' +
        '<td style="border-bottom:1.5px solid #000;text-align:right;font-weight:bold;padding:6px 8px;" class="font-monospace">₹' + totalAmount.toFixed(2) + '</td></tr>' +
        '<tr><td colSpan="3" style="border-right:2px solid #000;border-bottom:2px solid #000;text-align:right;font-weight:bold;padding:6px 8px;">Bill Total</td>' +
        '<td style="border-bottom:2px solid #000;text-align:right;font-weight:bold;font-size:11pt;padding:6px 8px;" class="font-monospace">₹' + totalAmount.toFixed(2) + '</td></tr>' +
        '<tr class="amount-in-words-row" style="border-bottom:2px solid #000;"><td colSpan="5" style="border-bottom:2px solid #000;padding:10px;">' +
        '<div style="font-size:8.5pt;color:#444;text-transform:uppercase;font-weight:bold;margin-bottom:4px;">Amount Chargeable (in words):</div>' +
        '<div style="font-weight:bold;font-size:9.5pt;">' + numberToWords(totalAmount) + '</div>' +
        '<div class="text-end" style="font-size:8.5pt;color:#555;font-style:italic;margin-top:-10px;">E. & O.E</div></td></tr>' +
        '<tr style="height:100px;"><td colSpan="3" class="declaration-box" style="border-right:2px solid #000;padding:10px;vertical-align:top;">' +
        '<div style="font-weight:bold;text-decoration:underline;margin-bottom:4px;">Declaration</div>We declare that this bill shows the actual price of the goods described and that all particulars are true and correct.</td>' +
        '<td colSpan="2" class="signatory-box" style="padding:10px;display:flex;flex-direction:column;justify-content:space-between;text-align:right;border:none;height:100px;">' +
        '<div style="font-weight:bold;text-transform:uppercase;font-size:9pt;">For ' + companyNameText + '</div>' +
        '<div style="font-size:8.5pt;color:#444;margin-top:45px;">Authorised Signatory</div></td></tr></tbody></table></div></td></tr></tbody></table>' +
        '<div class="footer-note">*** Composition dealer is not eligible to collect the taxes on supply. ***</div></div></body></html>';

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 300);
    } else {
      let logoBase64 = '';
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = enquiryLogo;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        logoBase64 = canvas.toDataURL('image/jpeg', 0.9);
      } catch (_) {}

      const statusClass = (order.status || 'pending').toLowerCase();
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
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #7209B7; }
    .brand { display: flex; align-items: center; gap: 16px; }
    .brand-logo { width: 70px; height: 70px; border-radius: 14px; border: 2px solid #7209B7; object-fit: contain; box-shadow: 0 4px 12px rgba(114, 9, 183, 0.15); }
    .brand-info h1 { color: #7209B7; font-size: 28px; margin-bottom: 4px; }
    .brand-info p { color: #888; font-size: 13px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { color: #7209B7; font-size: 32px; letter-spacing: 2px; margin-bottom: 10px; }
    .invoice-meta p { color: #666; font-size: 13px; line-height: 1.6; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .info-box { flex: 1; }
    .info-box h4 { color: #7209B7; text-transform: uppercase; font-size: 11px; letter-spacing: 1.5px; margin-bottom: 8px; }
    .info-box p { font-size: 13px; color: #555; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead th { background: #7209B7; color: #fff; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    tbody td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 13px; }
    tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; }
    tbody tr:nth-child(even) { background: #fdf8f3; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0; }
    .totals-row.grand { border-bottom: none; border-top: 2px solid #7209B7; padding-top: 12px; margin-top: 4px; font-size: 18px; font-weight: 700; color: #7209B7; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
    .footer p { margin-bottom: 4px; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-processing { background: #cce5ff; color: #004085; }
    .status-delivered { background: #d4edda; color: #155724; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
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
          <p>${settings?.address || 'Sivakasi, Tamil Nadu'} | ${settings?.phone || '+91 93427 58753'}</p>
        </div>
      </div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <p><strong>Invoice No:</strong> ${invoiceNo}</p>
        <p><strong>Date:</strong> ${invoiceDate}</p>
        <p><span class="status-badge status-${statusClass}">${order.status || 'Pending'}</span></p>
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
        <p>${(settings?.address || 'Festival Plaza, Main Road\\nSivakasi, Tamil Nadu').replace(/\\n/g, '<br/>')}</p>
        <p>${settings?.phone || '+91 93427 58753'}</p>
        <p>${settings?.email || 'kaviyacrackers5@gmail.com'}</p>
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
      <p>For queries, call ${settings?.phone || '+91 93427 58753'} or WhatsApp us.</p>
      <p style="margin-top:8px;">This is a computer-generated invoice.</p>
    </div>
  </div>
</body>
</html>`;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 300);
    }
  };

  if (!isAuthenticated) {
    return (
      <section id="loginSection" className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-4">
              <div className="bg-white p-5 rounded-5 shadow-lg text-center border-top border-5 border-primary">
                <img src={enquiryLogo} alt="Logo" height="80" className="mb-4 rounded-3 shadow-sm" />
                <h3 className="fw-bold mb-4">Admin Access</h3>
                <form onSubmit={handleLogin}>
                  <div className="form-floating mb-3">
                    <input type="text" className="form-control rounded-4 border-light bg-white-tertiary" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
                    <label>Username</label>
                  </div>
                  <div className="form-floating mb-3">
                    <input type="password" className="form-control rounded-4 border-light bg-white-tertiary" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
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
    <div className="container-fluid p-0 overflow-hidden position-relative">
      {/* Mobile Sidebar Overlay */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      <div className="row g-0">
        {/* Sidebar */}
        <div className={`col-lg-2 bg-white min-vh-100 border-end p-4 sidebar shadow-sm admin-sidebar ${isSidebarOpen ? 'show' : ''} ${isSidebarCollapsed ? 'd-lg-none' : 'd-lg-block'}`}>
          <div className="text-center mb-5 position-relative">
            <img src={enquiryLogo} alt="Logo" height="50" className="rounded-2 shadow-sm" />
            <h6 className="mt-3 fw-bold text-uppercase small tracking-widest text-primary">Kaviya Admin</h6>
            <button className="btn btn-sm btn-light position-absolute top-0 end-0 d-lg-none" onClick={() => setIsSidebarOpen(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <nav className="nav flex-column gap-2">
            {[
              { id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' },
              { id: 'catalog', icon: 'grid-3x3-gap-fill', label: 'Categories & Products' },
              { id: 'orders', icon: 'cart-check', label: 'Enquiries' },
              { id: 'billing', icon: 'receipt', label: 'Billing / Invoice' },
              { id: 'admins', icon: 'shield-lock', label: 'Admins' },
              { id: 'settings', icon: 'gear', label: 'Store Settings' },
            ].map(item => {
              const isItemActive = activeSection === item.id || 
                (item.id === 'catalog' && (activeSection === 'products' || activeSection === 'categories' || activeSection === 'catalog'));
              return (
                <button key={item.id} 
                        className={`nav-link border-0 text-start rounded-4 py-3 px-4 d-flex align-items-center gap-3 transition-all ${isItemActive ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-muted hover-light'}`}
                        onClick={() => setActiveSection(item.id)}>
                  <i className={`bi bi-${item.icon} fs-5`}></i>
                  <span className="fw-semibold">{item.label}</span>
                </button>
              );
            })}
            <Link className="nav-link border-0 text-start rounded-4 py-3 px-4 d-flex align-items-center gap-3 text-muted bg-transparent mt-2 text-decoration-none hover-light" to="/shop">
              <i className="bi bi-eye fs-5"></i>
              <span className="fw-semibold">View Store</span>
            </Link>
            <hr className="my-4 opacity-10" />
            <button className="nav-link border-0 text-start rounded-4 py-3 px-4 d-flex align-items-center gap-3 text-danger bg-transparent hover-soft-danger"
                    onClick={clearAdminSession}>
              <i className="bi bi-box-arrow-left fs-5"></i>
              <span className="fw-semibold">Logout</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className={`${isSidebarCollapsed ? 'col-lg-12 ms-0' : 'col-lg-10 ms-auto'} p-3 p-md-5 bg-white-tertiary min-vh-100 transition-all`}>
          
          {/* Admin Header */}
          <div className="d-flex align-items-center justify-content-between mb-4 bg-white p-3 rounded-4 shadow-sm no-print">
            <div className="d-flex align-items-center gap-3">
              {/* Mobile Sidebar Hamburger Toggle */}
              <button className="btn btn-light rounded-circle shadow-sm d-lg-none" onClick={() => setIsSidebarOpen(true)}>
                <i className="bi bi-list fs-4"></i>
              </button>
              
              {/* Desktop Sidebar Collapse Toggle */}
              <button className="btn btn-light rounded-circle shadow-sm d-none d-lg-inline-flex align-items-center justify-content-center" 
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      style={{ width: '40px', height: '40px' }}
                      title={isSidebarCollapsed ? "Expand Main Menu" : "Collapse Main Menu"}>
                <i className={`bi bi-${isSidebarCollapsed ? 'layout-sidebar-inset' : 'layout-sidebar'} fs-5 text-primary`}></i>
              </button>
              
              <h5 className="fw-bold m-0 text-primary d-none d-sm-block">Kaviya Admin Dashboard</h5>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 d-none d-md-inline-block fw-semibold">
                Logged in as {sessionStorage.getItem('admin_username') || 'Admin'}
              </span>
              <button className="btn btn-sm btn-outline-primary rounded-pill shadow-sm py-2 px-3 fw-bold" onClick={handleSync} disabled={isSyncing}>
                <i className={`bi bi-arrow-repeat me-1 ${isSyncing ? 'fa-spin' : ''}`}></i> {isSyncing ? 'Syncing...' : 'Sync'}
              </button>
            </div>
          </div>

          {activeSection === 'dashboard' && (
            <div className="admin-section animate-fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold m-0">Dashboard Overview</h2>
                <button className="btn btn-outline-primary rounded-pill px-4 fw-bold shadow-sm d-none d-lg-flex align-items-center" onClick={handleSync} disabled={isSyncing}>
                  <i className={`bi bi-arrow-repeat me-2 ${isSyncing ? 'fa-spin' : ''}`}></i> {isSyncing ? 'Syncing...' : 'Sync Data'}
                </button>
              </div>
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

              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="bg-white p-4 p-md-5 rounded-5 shadow-sm border-0 h-100">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 className="fw-bold m-0">Sales Analytics Report</h4>
                      <div className="btn-group btn-group-sm rounded-pill p-1 bg-light shadow-sm" role="group">
                        <button 
                          className={`btn rounded-pill px-3 fw-bold border-0 transition-all ${reportType === 'weekly' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted'}`}
                          onClick={() => setReportType('weekly')}
                        >
                          Weekly
                        </button>
                        <button 
                          className={`btn rounded-pill px-3 fw-bold border-0 transition-all ${reportType === 'monthly' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted'}`}
                          onClick={() => setReportType('monthly')}
                        >
                          Monthly
                        </button>
                        <button 
                          className={`btn rounded-pill px-3 fw-bold border-0 transition-all ${reportType === 'yearly' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted'}`}
                          onClick={() => setReportType('yearly')}
                        >
                          Yearly
                        </button>
                      </div>
                    </div>
                    
                    {/* Custom CSS Bar Chart */}
                    <div className="d-flex align-items-end justify-content-between pt-4 pb-2" style={{ height: '250px' }}>
                      {(() => {
                        const { data, maxSales } = getReportData(reportType);
                        const widthPct = reportType === 'weekly' ? '12%' : reportType === 'monthly' ? '20%' : '7%';
                        return data.map((item, idx) => (
                          <div key={idx} className="d-flex flex-column align-items-center" style={{ width: widthPct }}>
                            <div className="fw-bold text-dark small mb-2 opacity-75 text-nowrap" style={{ fontSize: '0.75rem' }}>
                              ₹{item.total >= 1000 ? (item.total/1000).toFixed(1) + 'k' : item.total}
                            </div>
                            <div className="w-100 rounded-top-3 bg-primary position-relative shadow-sm" 
                                 style={{ 
                                   height: `${(item.total / maxSales) * 160}px`, 
                                   minHeight: '4px',
                                   background: 'linear-gradient(180deg, #7209B7 0%, #3A0CA3 100%)',
                                   transition: 'height 1s ease-out'
                                 }}>
                            </div>
                            <div className="mt-3 text-muted small fw-semibold text-uppercase text-nowrap" style={{ fontSize: '0.7rem' }}>{item.label}</div>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Detailed Sales Data Table */}
                    <hr className="my-5 opacity-10" />
                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                      <i className="bi bi-table text-primary"></i> Detailed Statement ({reportType.toUpperCase()})
                    </h5>
                    <div className="table-responsive rounded-4 border shadow-sm">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-white-tertiary border-bottom text-uppercase" style={{ fontSize: '0.75rem', color: '#7209B7' }}>
                          <tr>
                            <th className="ps-4 py-3">Interval / Period</th>
                            <th className="py-3 text-center">Enquiries Received</th>
                            <th className="text-end pe-4 py-3">Total Sales Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const { data } = getReportData(reportType);
                            const activeData = [...data].reverse(); // Show latest first in table
                            return activeData.map((item, idx) => (
                              <tr key={idx}>
                                <td className="ps-4 py-3 fw-bold text-dark">{item.dateStr || item.label}</td>
                                <td className="text-center py-3">
                                  <span className="badge bg-soft-primary text-primary rounded-pill px-3 py-2 fw-semibold">
                                    {item.ordersCount} enquiries
                                  </span>
                                </td>
                                <td className="text-end pe-4 py-3 fw-bold text-primary" style={{ fontSize: '1.05rem' }}>
                                  ₹{item.total.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4">
                  <div className="bg-white p-4 p-md-5 rounded-5 shadow-sm border-0 h-100">
                    <h4 className="fw-bold mb-4">Quick Actions</h4>
                    <div className="d-flex flex-column gap-3">
                      <button className="btn btn-outline-primary rounded-4 py-3 text-start fw-bold d-flex align-items-center justify-content-between hover-scale shadow-sm"
                              onClick={() => { setActiveSection('catalog'); setTimeout(() => { openAddProductForCategory(''); }, 100); }}>
                        <span className="d-flex align-items-center gap-3">
                          <i className="bi bi-box-seam fs-4"></i> Add New Product
                        </span>
                        <i className="bi bi-chevron-right"></i>
                      </button>
                      <button className="btn btn-outline-warning rounded-4 py-3 text-start fw-bold d-flex align-items-center justify-content-between hover-scale shadow-sm"
                              onClick={() => { setActiveSection('catalog'); setTimeout(() => { setEditingCategory(null); setNewCategory({name:'', image:''}); setShowCategoryModal(true); }, 100); }}>
                        <span className="d-flex align-items-center gap-3 text-dark">
                          <i className="bi bi-grid fs-4 text-warning"></i> Create Category
                        </span>
                        <i className="bi bi-chevron-right text-dark"></i>
                      </button>
                      <button className="btn btn-outline-info rounded-4 py-3 text-start fw-bold d-flex align-items-center justify-content-between hover-scale shadow-sm"
                              onClick={() => setActiveSection('orders')}>
                        <span className="d-flex align-items-center gap-3 text-dark">
                          <i className="bi bi-chat-dots fs-4 text-info"></i> View Enquiries
                        </span>
                        <i className="bi bi-chevron-right text-dark"></i>
                      </button>
                      <Link to="/shop" className="btn btn-outline-success rounded-4 py-3 text-start fw-bold d-flex align-items-center justify-content-between hover-scale shadow-sm text-decoration-none mt-2">
                        <span className="d-flex align-items-center gap-3 text-dark">
                          <i className="bi bi-shop fs-4 text-success"></i> Visit Live Store
                        </span>
                        <i className="bi bi-box-arrow-up-right text-dark"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {(activeSection === 'catalog' || activeSection === 'products' || activeSection === 'categories') && (
            <div className="admin-section animate-fade-in">
              {/* Header with Title and Action Buttons */}
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                  <h2 className="fw-bold m-0 d-flex align-items-center gap-2">
                    <i className="bi bi-grid-3x3-gap-fill text-primary"></i> Categories &amp; Products
                  </h2>
                  <p className="text-muted mb-0">
                    Manage categories and their respective products with re-ordering for your live store
                  </p>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <button 
                    className="btn btn-outline-secondary rounded-pill px-3 py-2 fw-semibold shadow-sm"
                    onClick={handleToggleCollapseAll}
                    title={collapsedCategories.size === categories.length ? "Expand All Categories" : "Collapse All Categories"}
                  >
                    <i className={`bi ${collapsedCategories.size === categories.length ? 'bi-arrows-expand' : 'bi-arrows-collapse'} me-1`}></i>
                    {collapsedCategories.size === categories.length ? 'Expand All' : 'Collapse All'}
                  </button>
                  <button 
                    className="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold shadow-sm hover-scale"
                    onClick={() => { setEditingCategory(null); setNewCategory({name:'', image:''}); setShowCategoryModal(true); }}
                  >
                    <i className="bi bi-folder-plus me-1"></i> Add Category
                  </button>
                  <button 
                    className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-lg hover-scale" 
                    onClick={() => openAddProductForCategory('')}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Add Product
                  </button>
                </div>
              </div>

              {/* Search & Stats Bar */}
              <div className="bg-white p-3 rounded-4 shadow-sm mb-4 border d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '450px' }}>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 rounded-start-pill ps-3">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 rounded-end-pill py-2 shadow-none" 
                      placeholder="Search categories or products..." 
                      value={catalogSearch}
                      onChange={e => setCatalogSearch(e.target.value)}
                    />
                    {catalogSearch && (
                      <button 
                        className="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y z-3 pe-3 text-decoration-none"
                        onClick={() => setCatalogSearch('')}
                      >
                        <i className="bi bi-x-circle-fill"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3 text-muted small fw-semibold">
                  <span>
                    <strong className="text-primary">{categories.length}</strong> Categories
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-primary">{products.length}</strong> Total Products
                  </span>
                </div>
              </div>

              {/* Categories & Respective Products List */}
              {categories.length === 0 ? (
                <div className="bg-white p-5 rounded-5 shadow-sm text-center border">
                  <i className="bi bi-grid fs-1 text-muted d-block mb-3 opacity-50"></i>
                  <h4 className="fw-bold text-dark">No Categories Found</h4>
                  <p className="text-muted">Start by creating your first category to organize your products.</p>
                  <button 
                    className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm"
                    onClick={() => { setEditingCategory(null); setNewCategory({name:'', image:''}); setShowCategoryModal(true); }}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Add Category
                  </button>
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const originalCatIndex = categories.findIndex(c => String(c._id) === String(cat._id) || c.name === cat.name);
                  const catIdx = originalCatIndex !== -1 ? originalCatIndex : 0;
                  const catName = typeof cat === 'string' ? cat : cat.name;
                  const allCatProducts = groupedProducts[catName] || [];
                  const q = catalogSearch.trim().toLowerCase();
                  const catProducts = q
                    ? allCatProducts.filter(p => 
                        p.name.toLowerCase().includes(q) || 
                        (p.content && p.content.toLowerCase().includes(q)) ||
                        catName.toLowerCase().includes(q)
                      )
                    : allCatProducts;
                  const isCollapsed = collapsedCategories.has(catName) && !q;

                  return (
                    <div key={cat._id || catName} className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden">
                      {/* Category Header Bar */}
                      <div className="card-header bg-white border-bottom p-3 p-md-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <span className="badge bg-dark bg-opacity-75 rounded-pill px-3 py-2 fw-semibold" style={{ fontSize: '0.8rem' }}>
                            #{catIdx + 1}
                          </span>
                          <img 
                            src={getImageUrl(cat.image, logo)} 
                            alt={catName} 
                            width="48" 
                            height="48" 
                            className="rounded-3 shadow-sm object-fit-cover border" 
                          />
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <h5 className="fw-bold mb-0 text-dark">{catName}</h5>
                              <span className="badge bg-soft-primary text-primary rounded-pill px-3 py-1 fw-semibold" style={{ fontSize: '0.75rem' }}>
                                {allCatProducts.length} {allCatProducts.length === 1 ? 'product' : 'products'}
                              </span>
                            </div>
                            <small className="text-muted">Category Position #{catIdx + 1}</small>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {/* Re-order Category */}
                          <div className="btn-group btn-group-sm rounded-pill border p-1 bg-light shadow-sm me-2" role="group">
                            <button 
                              className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center border-0"
                              style={{ width: '30px', height: '30px', opacity: (catIdx === 0 || !!q) ? 0.3 : 1 }}
                              disabled={catIdx === 0 || !!q}
                              onClick={() => handleMoveCategory(catIdx, -1)}
                              title={q ? "Clear search to reorder" : "Move Category Up"}
                            >
                              <i className="bi bi-arrow-up fw-bold text-dark"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center border-0"
                              style={{ width: '30px', height: '30px', opacity: (catIdx === categories.length - 1 || !!q) ? 0.3 : 1 }}
                              disabled={catIdx === categories.length - 1 || !!q}
                              onClick={() => handleMoveCategory(catIdx, 1)}
                              title={q ? "Clear search to reorder" : "Move Category Down"}
                            >
                              <i className="bi bi-arrow-down fw-bold text-dark"></i>
                            </button>
                          </div>

                          {/* Category Actions */}
                          <button 
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                            onClick={() => openAddProductForCategory(catName)}
                            title="Add product into this category"
                          >
                            <i className="bi bi-plus-lg"></i>
                            <span>Add Product</span>
                          </button>
                          <button 
                            className="btn btn-sm btn-soft-primary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
                            onClick={() => openCategoryEditModal(cat)}
                          >
                            <i className="bi bi-pencil"></i>
                            <span>Edit</span>
                          </button>
                          <button 
                            className="btn btn-sm btn-soft-danger rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
                            onClick={() => handleDeleteCategory(cat._id)}
                          >
                            <i className="bi bi-trash"></i>
                            <span>Delete</span>
                          </button>
                          <button 
                            className="btn btn-sm btn-light rounded-circle shadow-sm border d-flex align-items-center justify-content-center ms-1"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => toggleCategoryCollapse(catName)}
                            title={isCollapsed ? "Expand Category" : "Collapse Category"}
                          >
                            <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
                          </button>
                        </div>
                      </div>

                      {/* Respective Products Table */}
                      {!isCollapsed && (
                        <div className="card-body p-0">
                          {catProducts.length === 0 ? (
                            <div className="text-center py-4 text-muted bg-light bg-opacity-50">
                              <i className="bi bi-box-seam fs-2 d-block mb-1 text-muted opacity-50"></i>
                              <p className="mb-2 small fw-semibold">No products in "{catName}" yet.</p>
                              <button 
                                className="btn btn-sm btn-primary rounded-pill px-3 fw-bold shadow-sm"
                                onClick={() => openAddProductForCategory(catName)}
                              >
                                <i className="bi bi-plus-lg me-1"></i> Add First Product
                              </button>
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-hover align-middle mb-0 text-nowrap">
                                <thead className="bg-light border-bottom text-muted small text-uppercase" style={{ fontSize: '0.75rem' }}>
                                  <tr>
                                    <th className="ps-4 py-3" style={{ width: '50px' }}>#</th>
                                    <th className="py-3" style={{ width: '60px' }}>Img</th>
                                    <th className="py-3">Product Name</th>
                                    <th className="py-3 text-center">Price</th>
                                    <th className="py-3 text-center" style={{ width: '110px' }}>Status</th>
                                    <th className="py-3 text-center" style={{ width: '110px' }}>Reorder Product</th>
                                    <th className="text-end pe-4 py-3">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {catProducts.map((p, pIdx) => (
                                    <tr key={p._id || p.id || pIdx} className={p.active === false ? 'opacity-75 bg-light' : ''}>
                                      <td className="ps-4 text-muted small fw-semibold">{pIdx + 1}</td>
                                      <td>
                                        <img 
                                          src={getImageUrl(p.image, enquiryLogo)} 
                                          alt={p.name} 
                                          width="48" 
                                          height="48" 
                                          className="rounded-3 shadow-sm object-fit-cover border" 
                                        />
                                      </td>
                                      <td>
                                        <div className="fw-bold text-dark">{p.name}</div>
                                        <div className="small text-muted">{p.content}</div>
                                      </td>
                                      <td className="text-center">
                                        <div className="fw-bold text-success">₹{Number(p.rate || 0).toFixed(2)}</div>
                                        <div className="text-muted small text-decoration-line-through">₹{Number(p.originalRate || 0).toFixed(2)}</div>
                                      </td>
                                      <td className="text-center">
                                        <div className="d-flex flex-column align-items-center gap-1">
                                          <div className="form-check form-switch p-0 m-0">
                                            <input 
                                              className="form-check-input cursor-pointer shadow-none m-0" 
                                              type="checkbox" 
                                              role="switch" 
                                              checked={p.active !== false} 
                                              onChange={() => handleToggleProductActive(p)}
                                              title={p.active !== false ? "Active (Click to set Inactive)" : "Inactive (Click to set Active)"}
                                              style={{ width: '2.4em', height: '1.2em', cursor: 'pointer' }}
                                            />
                                          </div>
                                          <span className={`badge ${p.active !== false ? 'bg-success text-white' : 'bg-secondary text-white'} rounded-pill fw-bold`} style={{ fontSize: '0.65rem' }}>
                                            {p.active !== false ? 'Active' : 'Inactive'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="text-center">
                                        <div className="d-flex justify-content-center gap-1">
                                          <button 
                                            className="btn btn-sm btn-outline-secondary rounded-circle p-1 d-flex align-items-center justify-content-center" 
                                            style={{ width: '30px', height: '30px', opacity: (pIdx === 0 || !!q) ? 0.3 : 1 }} 
                                            disabled={pIdx === 0 || !!q} 
                                            onClick={() => handleMoveProduct(p, -1)} 
                                            title={q ? "Clear search to reorder" : "Move Product Up"}>
                                            <i className="bi bi-arrow-up"></i>
                                          </button>
                                          <button 
                                            className="btn btn-sm btn-outline-secondary rounded-circle p-1 d-flex align-items-center justify-content-center" 
                                            style={{ width: '30px', height: '30px', opacity: (pIdx === allCatProducts.length - 1 || !!q) ? 0.3 : 1 }} 
                                            disabled={pIdx === allCatProducts.length - 1 || !!q} 
                                            onClick={() => handleMoveProduct(p, 1)} 
                                            title={q ? "Clear search to reorder" : "Move Product Down"}>
                                            <i className="bi bi-arrow-down"></i>
                                          </button>
                                        </div>
                                      </td>
                                      <td className="text-end pe-4">
                                        <button className="btn btn-sm btn-soft-primary rounded-circle me-2 p-2" onClick={() => openEditModal(p)} title="Edit Product">
                                          <i className="bi bi-pencil"></i>
                                        </button>
                                        <button className="btn btn-sm btn-soft-danger rounded-circle p-2" onClick={() => handleDeleteProduct(p._id)} title="Delete Product">
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Uncategorized Products (if any) */}
              {uncategorizedProducts.length > 0 && (
                <div className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden border-warning border-start border-4">
                  <div className="card-header bg-white border-bottom p-3 p-md-4 d-flex align-items-center justify-content-between">
                    <div>
                      <h5 className="fw-bold mb-0 text-warning text-dark">
                        <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                        Uncategorized Products ({uncategorizedProducts.length})
                      </h5>
                      <small className="text-muted">These products have categories that do not match any defined category</small>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 text-nowrap">
                        <thead className="bg-light border-bottom text-muted small text-uppercase">
                          <tr>
                            <th className="ps-4 py-3" style={{ width: '50px' }}>#</th>
                            <th className="py-3" style={{ width: '60px' }}>Img</th>
                            <th className="py-3">Product Name</th>
                            <th className="py-3">Assigned Category</th>
                            <th className="py-3 text-center">Price</th>
                            <th className="py-3 text-center" style={{ width: '110px' }}>Status</th>
                            <th className="text-end pe-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uncategorizedProducts.map((p, pIdx) => (
                            <tr key={p._id}>
                              <td className="ps-4 text-muted small">{pIdx + 1}</td>
                              <td>
                                <img src={getImageUrl(p.image, enquiryLogo)} alt={p.name} width="45" height="45" className="rounded-3 shadow-sm object-fit-cover border" />
                              </td>
                              <td>
                                <div className="fw-bold text-dark">{p.name}</div>
                                <div className="small text-muted">{p.content}</div>
                              </td>
                              <td>
                                <span className="badge bg-warning text-dark rounded-pill px-3 py-1">{p.category || 'None'}</span>
                              </td>
                              <td className="text-center">
                                <div className="fw-bold text-primary">₹{Number(p.rate || 0).toFixed(2)}</div>
                              </td>
                              <td className="text-center">
                                <span className={`badge ${p.active !== false ? 'bg-success text-white' : 'bg-secondary text-white'} rounded-pill fw-bold`}>
                                  {p.active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="text-end pe-4">
                                <button className="btn btn-sm btn-soft-primary rounded-circle me-2 p-2" onClick={() => openEditModal(p)} title="Edit Product">
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button className="btn btn-sm btn-soft-danger rounded-circle p-2" onClick={() => handleDeleteProduct(p._id)} title="Delete Product">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'orders' && (
            <div className="admin-section animate-fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="fw-bold mb-1">
                    {orderTab === 'online' ? 'Online Customer Enquiries' : 'In-Store Saved Bills'}
                  </h2>
                  <p className="text-muted mb-0">
                    {orderTab === 'online' 
                      ? 'Review and manage festival order enquiries submitted online' 
                      : 'Review and reprint saved store billing transactions'}
                  </p>
                </div>
                <button className="btn btn-outline-primary rounded-pill px-4 fw-bold shadow-sm d-none d-lg-flex align-items-center" onClick={handleSync} disabled={isSyncing}>
                  <i className={`bi bi-arrow-repeat me-2 ${isSyncing ? 'fa-spin' : ''}`}></i> {isSyncing ? 'Syncing...' : 'Sync Orders'}
                </button>
              </div>

              {/* Tabs navigation */}
              <div className="d-flex border-bottom mb-4">
                <button
                  className="btn border-0 rounded-0 pb-3 pt-2 px-4 transition-all"
                  style={orderTab === 'online' ? { color: '#7209B7', borderBottom: '3px solid #7209B7', fontWeight: 'bold' } : { color: '#6c757d', borderBottom: '3px solid transparent', fontWeight: 'bold', backgroundColor: 'transparent' }}
                  onClick={() => setOrderTab('online')}
                >
                  <i className="bi bi-globe2 me-2"></i>Online Enquiries
                </button>
                <button
                  className="btn border-0 rounded-0 pb-3 pt-2 px-4 transition-all"
                  style={orderTab === 'billing' ? { color: '#7209B7', borderBottom: '3px solid #7209B7', fontWeight: 'bold' } : { color: '#6c757d', borderBottom: '3px solid transparent', fontWeight: 'bold', backgroundColor: 'transparent' }}
                  onClick={() => setOrderTab('billing')}
                >
                  <i className="bi bi-receipt-cutoff me-2"></i>In-Store Saved Bills
                </button>
              </div>
              
              <div className="bg-white rounded-5 shadow-sm overflow-hidden border">
                <div className="table-responsive border-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-white-tertiary border-bottom">
                      <tr>
                        <th className="ps-4 py-3" style={{ minWidth: '130px', width: '130px' }}>Date</th>
                        <th className="py-3" style={{ minWidth: '160px', width: '180px' }}>Customer Info</th>
                        <th className="py-3" style={{ minWidth: '260px' }}>Address & Contact</th>
                        <th className="py-3 text-center" style={{ minWidth: '110px', width: '120px' }}>Total</th>
                        <th className="py-3 text-center" style={{ minWidth: '160px', width: '170px' }}>Actions</th>
                        <th className="text-end pe-4 py-3" style={{ minWidth: '130px', width: '140px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-5 text-muted">No entries found under this section.</td></tr>
                      ) : (
                        filteredOrders.map(order => (
                          <React.Fragment key={order._id}>
                            <tr style={{ overflow: 'visible', borderBottom: order.status === 'Cancelled' ? 'none' : '1px solid #dee2e6' }}>
                              <td className="ps-4 text-nowrap">
                                <div className="fw-semibold text-dark small">{new Date(order.date).toLocaleDateString()}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                              </td>
                              <td>
                                <div className="fw-bold text-dark">{order.customerName}</div>
                                <div className="small text-primary fw-semibold">{order.customerPhone}</div>
                              </td>
                              <td style={{ minWidth: '260px', whiteSpace: 'normal' }}>
                                <div className="small text-muted mb-1" style={{ wordBreak: 'break-word', lineHeight: '1.4' }}>
                                  {order.customerAddress}
                                </div>
                                {order.customerEmail && (
                                  <div className="small text-info text-truncate">{order.customerEmail}</div>
                                )}
                              </td>
                              <td className="text-center text-nowrap">
                                <span className="fw-bold text-primary fs-6">₹{order.totalAmount}</span>
                              </td>
                              <td className="text-center text-nowrap">
                                <button className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-sm me-2" onClick={() => handleViewOrder(order)}>
                                  <i className="bi bi-eye me-1"></i>View
                                </button>
                                <button className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm" onClick={() => handleDeleteOrder(order._id)}>
                                  <i className="bi bi-trash me-1"></i>Delete
                                </button>
                              </td>
                              <td className="text-end pe-4 text-nowrap" style={{ overflow: 'visible' }}>
                                <div className="dropdown" style={{ position: 'relative' }}>
                                  <button className={`btn btn-sm dropdown-toggle rounded-pill px-3 shadow-sm ${order.status === 'Delivered' ? 'btn-success' : (order.status === 'Processing' ? 'btn-warning text-white' : (order.status === 'Cancelled' ? 'btn-danger text-white' : 'btn-light'))}`} 
                                          data-bs-toggle="dropdown">
                                    {order.status}
                                  </button>
                                  <ul className="dropdown-menu dropdown-menu-end border-0 shadow rounded-4" style={{ zIndex: 1070, position: 'absolute' }}>
                                    <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order._id, 'Pending')}>Pending</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order._id, 'Processing')}>Processing</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order._id, 'Delivered')}>Delivered</button></li>
                                    <li><button className="dropdown-item text-danger fw-bold" onClick={() => handleStatusUpdate(order._id, 'Cancelled')}>Cancelled</button></li>
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          {order.status === 'Cancelled' && (
                            <tr style={{ backgroundColor: '#fff5f5' }}>
                              <td colSpan="6" className="p-3 border-bottom ps-4 pe-4">
                                <div className="d-flex align-items-center justify-content-between rounded-4 bg-white p-3 shadow-sm border border-danger border-opacity-25 animate-fade-in">
                                  <div className="d-flex align-items-start gap-3">
                                    <div className="bg-soft-danger text-danger rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                                      <i className="bi bi-x-circle fs-5"></i>
                                    </div>
                                    <div>
                                      <span className="badge bg-danger rounded-pill mb-1">Cancellation Note</span>
                                      <p className="mb-0 text-muted small fw-semibold">
                                        {order.cancellationNote || <span className="fst-italic text-secondary">No reason specified.</span>}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <button className="btn btn-sm btn-outline-secondary rounded-pill me-2 px-3 fw-bold shadow-sm" onClick={() => handleEditNote(order)}>
                                      <i className="bi bi-pencil me-1"></i> Edit
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold shadow-sm" onClick={() => handleRemoveNote(order)}>
                                      <i className="bi bi-eraser me-1"></i> Remove
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
               </div>
              </div>
            </div>
          )}


          {activeSection === 'admins' && (
            <div className="admin-section animate-fade-in">
              <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                  <h2 className="fw-bold m-0">Admin Settings</h2>
                  <p className="text-muted mb-0">Manage administrator users and reset passwords</p>
                </div>
                <button className="btn btn-outline-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center" onClick={loadAdmins} disabled={isSyncing}>
                  <i className="bi bi-arrow-repeat me-2"></i> Sync Admins
                </button>
              </div>

              {adminActionError && (
                <div className="alert alert-danger border-0 rounded-4 p-3 mb-4 shadow-sm animate-fade-in d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5 text-danger"></i>
                  <span className="fw-semibold text-danger">{adminActionError}</span>
                </div>
              )}

              {adminActionSuccess && (
                <div className="alert alert-success border-0 rounded-4 p-3 mb-4 shadow-sm animate-fade-in d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill fs-5 text-success"></i>
                  <span className="fw-semibold text-success">{adminActionSuccess}</span>
                </div>
              )}

              <div className="row g-4">
                {/* Admin Users List */}
                <div className="col-lg-6">
                  <div className="bg-white p-4 p-md-5 rounded-5 shadow-sm border-0 h-100">
                    <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
                      <i className="bi bi-people text-primary"></i> Admin Users
                    </h4>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-white-tertiary border-bottom">
                          <tr>
                            <th className="ps-3 py-3">#</th>
                            <th className="py-3">Username</th>
                            <th className="text-end pe-3 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admins.filter(admin => admin.username !== 'lokesh').length === 0 ? (
                            <tr><td colSpan="3" className="text-center py-4 text-muted">No admin users found.</td></tr>
                          ) : (
                            admins.filter(admin => admin.username !== 'lokesh').map((admin, idx) => (
                              <tr key={admin.username}>
                                <td className="ps-3 text-muted small">{idx + 1}</td>
                                <td>
                                  <span className="fw-bold text-dark">{admin.username}</span>
                                </td>
                                <td className="text-end pe-3">
                                  <button 
                                    className="btn btn-sm btn-outline-primary rounded-pill px-3 me-2 shadow-sm"
                                    onClick={() => {
                                      setSelectedAdminToReset(admin.username);
                                      setResetPasswordVal('');
                                      setAdminActionError('');
                                      setAdminActionSuccess('');
                                    }}
                                  >
                                    <i className="bi bi-key me-1"></i>Reset Password
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-soft-danger rounded-circle p-2"
                                    onClick={() => handleDeleteAdmin(admin.username)}
                                    disabled={admins.length <= 1}
                                    title="Delete Admin"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Password Reset & Create Section */}
                <div className="col-lg-6 d-flex flex-column gap-4">
                  {/* Password Reset Box */}
                  <div className="bg-white p-4 p-md-5 rounded-5 shadow-sm border-0">
                    <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
                      <i className="bi bi-shield-lock text-warning"></i> Reset Password
                    </h4>
                    <form onSubmit={handleResetPassword}>
                      <div className="form-group mb-3">
                        <label className="fw-bold mb-2 small text-muted text-uppercase tracking-wider">Select Admin</label>
                        <select 
                          className="form-select rounded-4 border-light bg-white-tertiary py-3 px-4 fw-semibold"
                          value={selectedAdminToReset}
                          onChange={e => setSelectedAdminToReset(e.target.value)}
                          required
                        >
                          <option value="">-- Select Admin User --</option>
                          {admins.filter(admin => admin.username !== 'lokesh').map(admin => (
                            <option key={admin.username} value={admin.username}>{admin.username}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group mb-4">
                        <label className="fw-bold mb-2 small text-muted text-uppercase tracking-wider">New Password (Numbers Only)</label>
                        <input 
                          type="text" 
                          className="form-control rounded-4 border-light bg-white-tertiary py-3 px-4 fw-semibold"
                          placeholder="e.g. 123456 (Only numbers allowed)"
                          value={resetPasswordVal}
                          onChange={e => {
                            // Enforce only digits in real-time
                            const val = e.target.value;
                            if (val === '' || /^\d+$/.test(val)) {
                              setResetPasswordVal(val);
                              setAdminActionError('');
                            } else {
                              setAdminActionError('Only numbers are allowed for admin passwords!');
                            }
                          }}
                          required
                        />
                        <div className="form-text text-muted small mt-2">
                          <i className="bi bi-info-circle me-1"></i> For security, the password must consist strictly of digits (0-9).
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-warning w-100 py-3 rounded-pill fw-bold text-dark shadow-sm hover-scale d-flex align-items-center justify-content-center gap-2"
                        disabled={!selectedAdminToReset || !resetPasswordVal}
                      >
                        <i className="bi bi-check-circle"></i> Save New Password
                      </button>
                    </form>
                  </div>

                  {/* Create Admin Box */}
                  <div className="bg-white p-4 p-md-5 rounded-5 shadow-sm border-0">
                    <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
                      <i className="bi bi-person-plus text-success"></i> Create New Admin
                    </h4>
                    <form onSubmit={handleCreateAdmin}>
                      <div className="form-group mb-3">
                        <label className="fw-bold mb-2 small text-muted text-uppercase tracking-wider">Username</label>
                        <input 
                          type="text" 
                          className="form-control rounded-4 border-light bg-white-tertiary py-3 px-4 fw-semibold"
                          placeholder="e.g. vasanth"
                          value={newAdminUser}
                          onChange={e => setNewAdminUser(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                          required
                        />
                      </div>

                      <div className="form-group mb-4">
                        <label className="fw-bold mb-2 small text-muted text-uppercase tracking-wider">Password (Numbers Only)</label>
                        <input 
                          type="text" 
                          className="form-control rounded-4 border-light bg-white-tertiary py-3 px-4 fw-semibold"
                          placeholder="e.g. 123456"
                          value={newAdminPassword}
                          onChange={e => {
                            // Enforce only digits in real-time
                            const val = e.target.value;
                            if (val === '' || /^\d+$/.test(val)) {
                              setNewAdminPassword(val);
                              setAdminActionError('');
                            } else {
                              setAdminActionError('Only numbers are allowed for admin passwords!');
                            }
                          }}
                          required
                        />
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-success w-100 py-3 rounded-pill fw-bold shadow-sm hover-scale d-flex align-items-center justify-content-center gap-2"
                        disabled={!newAdminUser || !newAdminPassword}
                      >
                        <i className="bi bi-plus-circle"></i> Create Administrator
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="admin-section animate-fade-in">
              <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                  <h2 className="fw-bold m-0">Store Settings</h2>
                  <p className="text-muted mb-0">Manage contact information displayed across the website and invoices.</p>
                </div>
              </div>
              <div className="bg-white p-4 p-md-5 rounded-5 shadow-sm border-0">
                <form onSubmit={handleSaveSettings}>
                  {settingsSaveStatus === 'success' && <div className="alert alert-success d-flex align-items-center gap-2"><i className="bi bi-check-circle-fill"></i>Settings saved successfully!</div>}
                  {settingsSaveStatus === 'error' && <div className="alert alert-danger d-flex align-items-center gap-2"><i className="bi bi-exclamation-triangle-fill"></i>Failed to save settings.</div>}
                  <div className="row g-4">
                    <div className="col-12">
                      <div className="form-floating">
                        <input type="text" className="form-control rounded-4 border-light bg-white-tertiary" id="storeCompanyName" 
                               value={settings.companyName || ''} onChange={e => setSettings({...settings, companyName: e.target.value})} required />
                        <label htmlFor="storeCompanyName">Company Name (Shown on Invoices, e.g. ADVAY TRADERS)</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input type="text" className="form-control rounded-4 border-light bg-white-tertiary" id="storePhone" 
                               value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})} required />
                        <label htmlFor="storePhone">Store Contact Phone (e.g. +91 93427 58753)</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input type="text" className="form-control rounded-4 border-light bg-white-tertiary" id="storeWhatsapp" 
                               value={settings.whatsapp || ''} onChange={e => setSettings({...settings, whatsapp: e.target.value})} required />
                        <label htmlFor="storeWhatsapp">WhatsApp Number (e.g. 919342758753)</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-floating">
                        <input type="email" className="form-control rounded-4 border-light bg-white-tertiary" id="storeEmail" 
                               value={settings.email || ''} onChange={e => setSettings({...settings, email: e.target.value})} required />
                        <label htmlFor="storeEmail">Store Email (For Receiving Enquiries)</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-floating">
                        <textarea className="form-control rounded-4 border-light bg-white-tertiary" id="storeAddress" style={{ height: '100px' }}
                                  value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} required></textarea>
                        <label htmlFor="storeAddress">Store Physical Address (Shown on Invoices)</label>
                      </div>
                    </div>
                    <div className="col-12 mt-4">
                      <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm d-flex align-items-center gap-2" disabled={settingsSaveStatus === 'saving'}>
                        {settingsSaveStatus === 'saving' ? <><i className="bi bi-arrow-repeat fa-spin"></i> Saving...</> : <><i className="bi bi-save"></i> Save Settings</>}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <BillingSection 
              products={products} 
              settings={settings} 
              loadData={loadData} 
            />
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
                    <input type="text" className="form-control rounded-4 bg-white-tertiary border-0 py-2" placeholder="e.g. 10cm Sparklers" required 
                           value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Category</label>
                      <select className="form-select rounded-4 bg-white-tertiary border-0 py-2" required
                              value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                        <option value="">Select...</option>
                        {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Content (e.g. 10 Pcs)</label>
                      <input type="text" className="form-control rounded-4 bg-white-tertiary border-0 py-2" required
                             value={newProduct.content} onChange={e => setNewProduct({...newProduct, content: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Offer Rate (₹)</label>
                      <input type="number" className="form-control rounded-4 bg-white-tertiary border-0 py-2" required
                             value={newProduct.rate} onChange={e => setNewProduct({...newProduct, rate: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Original Rate (₹)</label>
                      <input type="number" className="form-control rounded-4 bg-white-tertiary border-0 py-2" required
                             value={newProduct.originalRate} onChange={e => setNewProduct({...newProduct, originalRate: e.target.value})} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Product Image</label>
                      <div className="d-flex gap-3 align-items-center">
                        <input type="file" className="form-control rounded-4 bg-white-tertiary border-0 py-2" 
                               accept="image/*" disabled={isUploadingImage} onChange={e => handleImageUpload(e, 'product')} />
                        {isUploadingImage && (
                          <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                            <span className="visually-hidden">Uploading...</span>
                          </div>
                        )}
                        {newProduct.image && (
                          <img src={getImageUrl(newProduct.image, logo)} 
                               width="40" height="40" className="rounded shadow-sm object-fit-cover" />
                        )}
                      </div>
                      <input type="text" className="form-control rounded-4 bg-white-tertiary border-0 py-2 mt-2 small" 
                             style={{fontSize:'0.7rem'}} placeholder="Or paste image URL/path"
                             value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
                    </div>
                    <div className="col-12">
                      <div className="form-check form-switch bg-white-tertiary rounded-4 p-3 d-flex align-items-center justify-content-between m-0">
                        <label className="form-check-label fw-bold small text-dark mb-0 cursor-pointer" htmlFor="productActiveModalSwitch">
                          <i className={`bi ${newProduct.active ? 'bi-eye-fill text-success' : 'bi-eye-slash-fill text-muted'} me-2 fs-5 align-middle`}></i>
                          Status: <span className={newProduct.active ? 'text-success' : 'text-danger'}>{newProduct.active ? 'Active (Visible on Store)' : 'Inactive (Hidden from Store)'}</span>
                        </label>
                        <input 
                          className="form-check-input cursor-pointer shadow-none ms-0" 
                          type="checkbox" 
                          role="switch"
                          id="productActiveModalSwitch"
                          checked={newProduct.active !== false} 
                          onChange={e => setNewProduct({ ...newProduct, active: e.target.checked })}
                          style={{ width: '2.8em', height: '1.4em', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold mt-4 shadow-lg hover-scale" type="submit" disabled={isUploadingImage}>
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
                    <input type="text" className="form-control rounded-4 bg-white-tertiary border-0 py-2" placeholder="e.g. Sparklers" required 
                           value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Category Image</label>
                    <div className="d-flex gap-3 align-items-center mb-2">
                      <input type="file" className="form-control rounded-4 bg-white-tertiary border-0 py-2" 
                             accept="image/*" disabled={isUploadingImage} onChange={e => handleImageUpload(e, 'category')} />
                      {isUploadingImage && (
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                          <span className="visually-hidden">Uploading...</span>
                        </div>
                      )}
                      {newCategory.image && (
                        <img src={getImageUrl(newCategory.image, logo)} 
                             width="40" height="40" className="rounded shadow-sm object-fit-cover" />
                      )}
                    </div>
                    <input type="text" className="form-control rounded-4 bg-white-tertiary border-0 py-2 small" 
                           style={{fontSize:'0.7rem'}} placeholder="Or paste image URL/path"
                           value={newCategory.image} onChange={e => setNewCategory({...newCategory, image: e.target.value})} />
                  </div>
                  <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold mt-4 shadow-lg hover-scale" type="submit" disabled={isUploadingImage}>
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
                    <div className="bg-white-tertiary rounded-4 p-3 h-100">
                      <h6 className="fw-bold text-uppercase small mb-2" style={{fontSize:'0.7rem', color:'#7209B7'}}>Customer</h6>
                      <p className="fw-bold mb-1">{selectedOrder.customerName}</p>
                      <p className="small text-muted mb-1"><i className="bi bi-telephone me-1"></i>{selectedOrder.customerPhone}</p>
                      <p className="small text-muted mb-0"><i className="bi bi-envelope me-1"></i>{selectedOrder.customerEmail}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-white-tertiary rounded-4 p-3 h-100">
                      <h6 className="fw-bold text-uppercase small mb-2" style={{fontSize:'0.7rem', color:'#7209B7'}}>Delivery</h6>
                      <p className="small text-muted mb-1"><i className="bi bi-geo-alt me-1"></i>{selectedOrder.customerAddress}</p>
                      <p className="small text-muted mb-1"><i className="bi bi-calendar3 me-1"></i>{new Date(selectedOrder.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <span className={`badge rounded-pill px-3 py-1 ${
                        selectedOrder.status === 'Delivered' ? 'bg-success' : 
                        selectedOrder.status === 'Processing' ? 'bg-warning text-dark' : 
                        selectedOrder.status === 'Cancelled' ? 'bg-danger text-white' : 'bg-secondary'
                      }`}>{selectedOrder.status}</span>
                    </div>
                  </div>
                </div>

                {/* Cancellation Note Alert */}
                {selectedOrder.status === 'Cancelled' && (
                  <div className="alert alert-danger border-0 rounded-4 p-3 mb-4 shadow-sm animate-fade-in">
                    <div className="d-flex align-items-start gap-2">
                      <i className="bi bi-exclamation-triangle-fill fs-5 text-danger"></i>
                      <div>
                        <strong className="text-danger d-block mb-1">Order Cancelled</strong>
                        <span className="text-muted small">
                          <strong>Reason:</strong> {selectedOrder.cancellationNote || "No reason specified."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Table */}
                <div className="bg-white rounded-4 border overflow-hidden shadow-sm">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{backgroundColor:'#7209B7'}}>
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
                            <span className="badge bg-white-tertiary text-dark border px-3 py-2 rounded-pill fw-bold">{item.quantity || 0}</span>
                          </td>
                          <td className="text-end text-muted">₹{Number(item.rate || 0).toFixed(2)}</td>
                          <td className="text-end pe-4 fw-bold text-primary">₹{Number(item.subtotal || ((item.rate || 0) * (item.quantity || 0))).toFixed(2)}</td>
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
              <div className="modal-footer border-0 p-4 pt-2 gap-2">
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
