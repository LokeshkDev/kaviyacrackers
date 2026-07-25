import React, { useState, useMemo, useEffect, useRef } from 'react';
import { api } from '../hooks/useApi';
import logo from '../assets/img/kaviya_crackers_logo.jpeg';
import logoBackground from '../img/logo-background.png';

// Helper: Convert a number to Indian Rupees in words
const numberToWords = (num) => {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function g(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  function h(n) {
    if (n < 100) return g(n);
    const rest = n % 100;
    return a[Math.floor(n / 100)] + ' Hundred' + (rest ? ' and ' + g(rest) : '');
  }

  function handleSection(n, label) {
    if (n === 0) return '';
    return h(n) + ' ' + label + ' ';
  }

  let str = '';
  let rupees = Math.floor(num);
  let paise = Math.round((num - rupees) * 100);

  const crores = Math.floor(rupees / 10000000);
  rupees %= 10000000;
  const lakhs = Math.floor(rupees / 100000);
  rupees %= 100000;
  const thousands = Math.floor(rupees / 1000);
  rupees %= 1000;

  str += handleSection(crores, 'Crore');
  str += handleSection(lakhs, 'Lakh');
  str += handleSection(thousands, 'Thousand');
  str += handleSection(rupees, '');

  str = str.trim() + ' Rupees';

  if (paise > 0) {
    str += ' and ' + g(paise) + ' Paise';
  }

  return str + ' Only';
};

const BillingSection = ({ products = [], settings = {}, loadData }) => {
  // Store details local state (initialized from settings, or fallbacks)
  const [companyName, setCompanyName] = useState('KAVIYA CRACKERS');
  const [companyAddress, setCompanyAddress] = useState('3/574, Sivakasi to Sattur Main Road, Near Anuupankulam Bus Stop, Sivakasi - 626189, Virudhunagar (Dt.), Tamil Nadu.');
  const [companyPhone, setCompanyPhone] = useState('8248361625');

  // Customer / Buyer State
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Document settings (Type & Number)
  const [docType, setDocType] = useState('Estimate'); // 'Estimate' or 'Invoice'
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Billing Items: starts with one empty row
  const [billingItems, setBillingItems] = useState([createEmptyRow()]);
  const [discountPercent, setDiscountPercent] = useState(80); // Default to 80% off

  // Autocomplete tracking
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Recent Bills List State
  const [recentBills, setRecentBills] = useState([]);

  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || 'KAVIYA CRACKERS');
      setCompanyAddress(settings.address || '3/574, Sivakasi to Sattur Main Road, Near Anuupankulam Bus Stop, Sivakasi - 626189, Virudhunagar (Dt.), Tamil Nadu.');
      setCompanyPhone(settings.phone || '8248361625');
    }
  }, [settings]);

  // Generate default Invoice/Estimate format once on mount
  useEffect(() => {
    generateDocNumber(docType);
  }, []);

  // Fetch recent bills on mount and after updates
  useEffect(() => {
    fetchRecentBills();
  }, []);

  // Handle click outside autocomplete dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setActiveRowIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate Document Number based on DocType
  const generateDocNumber = (type) => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const nextYy = String(now.getFullYear() + 1).slice(-2);
    const rand = String(Math.floor(100 + Math.random() * 900)).padStart(3, '0');
    const code = type === 'Invoice' ? 'INV' : 'EST';
    setInvoiceNumber(`${rand}/${code}${yy}-${nextYy}`);
  };

  // Document Type Change handler
  const handleDocTypeChange = (type) => {
    setDocType(type);
    setInvoiceNumber(prev => {
      const parts = prev.split('/');
      const num = parts[0];
      const yySuffix = parts[1] ? parts[1].replace(/[A-Z]+/, type === 'Invoice' ? 'INV' : 'EST') : (type === 'Invoice' ? 'INV' : 'EST');
      return `${num}/${yySuffix}`;
    });
  };

  // Fetch Saved Bills / Completed Orders
  const fetchRecentBills = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data) {
        // Filter for completed or store-billing-panel generated bills
        const filtered = res.data
          .filter(order => order.status === 'Completed' || (order.cancellationNote && order.cancellationNote.includes('Billing Panel')))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentBills(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch recent bills:', err);
    }
  };

  // Helper to create a new blank row
  function createEmptyRow() {
    return {
      _id: '',
      id: '',
      name: '',
      category: '',
      content: '',
      quantity: '',
      originalRate: '', // acts as the unit Rate (MRP) shown in the row
      rate: '',         // acts as the computed offer rate
      amount: 0,
      isCustom: false
    };
  }

  // Filter products for the active row's typed name
  const filteredProducts = useMemo(() => {
    if (activeRowIndex === null) return [];
    const query = billingItems[activeRowIndex]?.name || '';
    const q = query.toLowerCase().trim();
    if (!q) {
      return products.filter(p => p.active).slice(0, 10);
    }
    return products.filter(p => {
      if (!p.active) return false;
      return p.name.toLowerCase().includes(q) || 
             (p.category && p.category.toLowerCase().includes(q));
    }).slice(0, 10);
  }, [products, billingItems, activeRowIndex]);

  // Handle product autocomplete keyboard selection
  const handleKeyDown = (index, e) => {
    if (activeRowIndex !== index) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowDropdown(true);
      setSelectedAutocompleteIndex(prev => 
        filteredProducts.length > 0 ? (prev + 1) % filteredProducts.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setShowDropdown(true);
      setSelectedAutocompleteIndex(prev => 
        filteredProducts.length > 0 ? (prev - 1 + filteredProducts.length) % filteredProducts.length : 0
      );
    } else if (e.key === 'Enter') {
      if (showDropdown && filteredProducts[selectedAutocompleteIndex]) {
        e.preventDefault();
        handleSelectProduct(index, filteredProducts[selectedAutocompleteIndex]);
      } else {
        // Normal tab/enter behavior: focus quantity input
        const qtyInput = document.getElementById(`qty-${index}`);
        if (qtyInput) {
          e.preventDefault();
          qtyInput.focus();
          qtyInput.select();
        }
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveRowIndex(null);
    }
  };

  // Autocomplete Select Product
  const handleSelectProduct = (index, product) => {
    setBillingItems(prev => {
      const updated = [...prev];
      const mrp = product.originalRate || product.rate || 0;
      
      updated[index] = {
        _id: product._id,
        id: product.id,
        name: product.name,
        category: product.category,
        content: product.content,
        quantity: 1,
        originalRate: mrp, // Table Rate column
        rate: product.rate || mrp, // Base offer rate
        amount: mrp * 1,
        isCustom: false
      };

      // Automatically append a new blank row if this was the last row
      if (index === prev.length - 1) {
        updated.push(createEmptyRow());
      }
      return updated;
    });

    setShowDropdown(false);
    setActiveRowIndex(null);
    setSelectedAutocompleteIndex(0);

    // Focus quantity cell
    setTimeout(() => {
      const qtyInput = document.getElementById(`qty-${index}`);
      if (qtyInput) {
        qtyInput.focus();
        qtyInput.select();
      }
    }, 50);
  };

  // Handle typing inside row name input
  const handleProductInputChange = (index, val) => {
    setBillingItems(prev => {
      const updated = [...prev];
      updated[index].name = val;
      updated[index].isCustom = true; // Mark as custom unless selected from autocomplete
      return updated;
    });
    setActiveRowIndex(index);
    setSelectedAutocompleteIndex(0);
    setShowDropdown(true);
  };

  // Update item quantity
  const handleQtyChange = (index, qtyVal) => {
    setBillingItems(prev => {
      const updated = [...prev];
      const parsedQty = parseInt(qtyVal, 10);
      updated[index].quantity = qtyVal === '' ? '' : (isNaN(parsedQty) ? 0 : parsedQty);
      
      const rateVal = parseFloat(updated[index].originalRate) || 0;
      updated[index].amount = (updated[index].quantity || 0) * rateVal;
      return updated;
    });
  };

  // Update item rate (MRP)
  const handleRateChange = (index, rateVal) => {
    setBillingItems(prev => {
      const updated = [...prev];
      const parsedRate = parseFloat(rateVal);
      updated[index].originalRate = rateVal === '' ? '' : (isNaN(parsedRate) ? 0 : parsedRate);
      
      const qtyVal = parseInt(updated[index].quantity, 10) || 0;
      updated[index].amount = qtyVal * (updated[index].originalRate || 0);
      return updated;
    });
  };

  // Remove row
  const handleRemoveRow = (index) => {
    setBillingItems(prev => {
      const filtered = prev.filter((_, idx) => idx !== index);
      if (filtered.length === 0) {
        return [createEmptyRow()];
      }
      return filtered;
    });
  };

  // Filter out completely empty rows
  const activeBillingItems = useMemo(() => {
    return billingItems.filter(item => item.name.trim() !== '');
  }, [billingItems]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalQty = 0;
    let subtotal = 0;

    activeBillingItems.forEach(item => {
      const qty = parseInt(item.quantity, 10) || 0;
      const rate = parseFloat(item.originalRate) || 0;
      totalQty += qty;
      subtotal += qty * rate;
    });

    const discountAmount = subtotal * (discountPercent / 100);
    const discountedTotal = Math.round(subtotal - discountAmount);

    return {
      totalQty,
      subtotal,
      discountAmount,
      discountedTotal
    };
  }, [activeBillingItems, discountPercent]);

  // Reset form
  const handleReset = () => {
    setCustomer({
      name: '',
      phone: '',
      address: ''
    });
    setBillingItems([createEmptyRow()]);
    setDiscountPercent(80);
    generateDocNumber(docType);
    setErrorMessage('');
    setSaveStatus(null);
  };

  // Save bill to Database
  const handleSaveBill = async () => {
    if (!customer.name.trim()) {
      setErrorMessage('Buyer/Customer Name is required to save the bill.');
      window.scrollTo(0, 0);
      return;
    }
    if (activeBillingItems.length === 0) {
      setErrorMessage('Please add at least one product to save the bill.');
      window.scrollTo(0, 0);
      return;
    }

    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const orderItems = activeBillingItems.map(item => {
        const qty = parseInt(item.quantity, 10) || 0;
        const mrp = parseFloat(item.originalRate) || 0;
        const itemOfferRate = mrp * (1 - discountPercent / 100);
        return {
          productId: item.id || null,
          name: item.name,
          category: item.category || 'Custom',
          content: item.content || 'box',
          quantity: qty,
          rate: itemOfferRate,
          originalRate: mrp,
          subtotal: itemOfferRate * qty,
          originalSubtotal: mrp * qty,
          savings: (mrp - itemOfferRate) * qty
        };
      });

      const invoiceData = {
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        customerAddress: customer.address.trim(),
        items: orderItems,
        subtotalAmount: totals.subtotal,
        discountPercent: discountPercent,
        discountAmount: totals.discountAmount,
        totalAmount: totals.discountedTotal,
        status: 'Completed',
        date: new Date(invoiceDate),
        cancellationNote: `Billing Panel ${docType}: ${invoiceNumber}`
      };

      const res = await api.post('/orders', invoiceData);
      if (res.status === 200 || res.data?.success) {
        setSaveStatus('success');
        fetchRecentBills(); // Reload saved bills list
        if (loadData) loadData();
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        throw new Error('Server returned invalid response');
      }
    } catch (err) {
      console.error('Failed to save bill:', err);
      setSaveStatus('error');
      setErrorMessage(err.response?.data?.message || 'Failed to save bill. Please try again.');
      window.scrollTo(0, 0);
    }
  };

  // Reusable print flow function (avoiding popup blockers and repeating headers)
  const handlePrintOrder = (order) => {
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

    const logoUrl = getAbsoluteUrl(logo);
    const logoBackgroundUrl = getAbsoluteUrl(logoBackground);

    let parsedDate = '';
    try {
      const d = order.date ? new Date(order.date) : new Date();
      parsedDate = isNaN(d.getTime()) 
        ? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
        : d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    } catch (_) {
      parsedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    }

    const cancellation = order.cancellationNote || '';
    const isInvoice = cancellation.includes('INV') || cancellation.includes('Invoice');
    const docTitleLabel = isInvoice ? 'Tax Invoice' : 'Estimate';
    const docNoLabel = isInvoice ? 'Invoice No.' : 'Estimate No.';
    
    const docNo = cancellation.includes('Billing Panel')
      ? cancellation.split(':').pop().trim()
      : (cancellation.includes('Invoice:')
          ? cancellation.split('Invoice:').pop().trim()
          : `EST-${String(order._id || 'TEMP').slice(-6).toUpperCase()}`);

    const items = order.items || [];
    const subtotal = order.subtotalAmount || items.reduce((sum, item) => sum + ((item.originalRate || item.rate || 0) * (item.quantity || 0)), 0);
    const totalAmount = order.totalAmount || 0;
    const discountAmount = order.discountAmount !== undefined ? order.discountAmount : Math.max(0, subtotal - totalAmount);
    const discountPct = order.discountPercent !== undefined ? order.discountPercent : (subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0);
    const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

    const minRows = 11;
    const paddingCount = Math.max(0, minRows - items.length);
    let paddingHtml = '';
    for (let i = 0; i < paddingCount; i++) {
      paddingHtml += `
        <tr style="height: 35px;">
          <td style="border-right: 2px solid #000; border-bottom: 1.5px solid #000;"></td>
          <td style="border-right: 2px solid #000; border-bottom: 1.5px solid #000;"></td>
          <td style="border-right: 2px solid #000; border-bottom: 1.5px solid #000;"></td>
          <td style="border-right: 2px solid #000; border-bottom: 1.5px solid #000;"></td>
          <td style="border-bottom: 1.5px solid #000;"></td>
        </tr>
      `;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${docTitleLabel} - ${docNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #000; background: transparent; padding: 20px; font-size: 10pt; position: relative; }
    .print-master-table { width: 100%; max-width: 800px; margin: 0 auto; border-collapse: collapse; border: 2.5px solid #000; background: transparent; position: relative; z-index: 2; }
    .bill-sheet { width: 100%; max-width: 800px; margin: 0 auto; background: transparent; }
    .row-flex { display: flex; }
    .border-bottom-black { border-bottom: 2px solid #000; }
    .border-right-black { border-right: 2px solid #000; }
    .header-logo { width: 25%; display: flex; align-items: center; justify-content: center; min-height: 120px; }
    .header-logo-box { width: 85px; height: 85px; border: 1.5px solid #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; background-color: #fff; }
    .logo-img { width: 100%; height: 100%; object-fit: cover; }
    .header-details { width: 75%; padding: 12px; text-align: center; }
    .header-details h1 { font-size: 19pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
    .header-details p { font-size: 9pt; color: #111; line-height: 1.4; margin-bottom: 2px; }
    .buyer-box { width: 60%; padding: 12px; text-align: left; }
    .meta-box { width: 40%; padding: 12px; text-align: left; }
    .box-title { font-weight: bold; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-bottom: 8px; text-transform: uppercase; font-size: 8.5pt; color: #333; }
    .meta-row { display: flex; align-items: center; margin-bottom: 6px; }
    .meta-label { font-weight: bold; width: 110px; font-size: 9.5pt; }
    .product-table { width: 100%; border-collapse: collapse; }
    .product-table th { border-right: 2px solid #000; border-bottom: 2px solid #000; padding: 8px; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; text-align: center; }
    .product-table td { border-right: 2px solid #000; border-bottom: 1.5px solid #000; padding: 6px 8px; vertical-align: top; font-size: 9.5pt; }
    .product-table th:last-child, .product-table td:last-child { border-right: none; }
    .text-center { text-align: center; }
    .text-end { text-align: right; }
    .font-monospace { font-family: monospace; }
    .totals-row td { border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; padding: 8px; }
    .amount-in-words-row td { padding: 12px; }
    .declaration-box { width: 60%; padding: 12px; font-size: 8pt; line-height: 1.4; }
    .signatory-box { padding: 12px; display: flex; flex-direction: column; justify-content: space-between; text-align: right; }
    .footer-note { text-align: center; font-weight: bold; margin-top: 15px; font-size: 9pt; }
    @media print {
      body { padding: 0; }
      @page { size: A4 portrait; margin: 1cm; }
      .d-print-none { display: none !important; }
      thead { display: table-header-group; }
      tbody { display: table-row-group; }
    }
    .watermark-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      height: 300px;
      opacity: 0.15;
      pointer-events: none;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .watermark-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="watermark-container">
    <img src="${logoBackgroundUrl}" class="watermark-img" />
  </div>
  <div style="max-width: 800px; margin: 0 auto;">
    <table class="print-master-table">
      <!-- Repeating Header -->
      <thead>
        <tr>
          <td style="padding: 0; border-bottom: 2px solid #000;">
            <div class="bill-sheet">
              <div class="text-center border-bottom-black py-1 fw-bold text-uppercase tracking-wider" style="font-size: 11pt;">
                ${docTitleLabel}
              </div>
              <div class="row-flex align-items-center">
                <div class="header-logo border-right-black">
                  <div class="header-logo-box">
                    <img src="${logoUrl}" class="logo-img" />
                  </div>
                </div>
                <div class="header-details">
                  <h1>${companyName}</h1>
                  <p>${companyAddress}</p>
                  <p style="font-weight: bold; margin-top: 2px;">Ph: ${companyPhone}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </thead>
      
      <!-- Flowable body -->
      <tbody>
        <tr>
          <td style="padding: 0;">
            <div class="bill-sheet">
              <div class="row-flex border-bottom-black" style="min-height: 115px;">
                <div class="buyer-box border-right-black">
                  <div class="box-title">Buyer</div>
                  <p style="font-weight: bold; font-size: 10pt; margin-bottom: 2px;">${order.customerName || 'In-Store Cash Customer'}</p>
                  <p style="font-size: 9pt; color: #222; line-height: 1.4; white-space: pre-line;">${order.customerAddress || ''}</p>
                  ${order.customerPhone ? `<p style="font-size: 9pt; margin-top: 4px; font-weight: 500;">Ph: ${order.customerPhone}</p>` : ''}
                </div>
                <div class="meta-box">
                  <div class="meta-row">
                    <span class="meta-label">${docNoLabel}</span>
                    <span style="font-weight: bold;">: ${docNo}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Dated</span>
                    <span>: ${parsedDate}</span>
                  </div>
                </div>
              </div>

              <table class="product-table" style="width: 100%; border-collapse: collapse; border-bottom: none;">
                <thead>
                  <tr class="text-center">
                    <th style="width: 50px;">S.No</th>
                    <th>Products</th>
                    <th style="width: 100px;">Qty</th>
                    <th style="width: 120px;">Rate</th>
                    <th style="width: 140px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((item, idx) => `
                    <tr>
                      <td class="text-center" style="font-weight: bold; color: #333; border-right: 2px solid #000; border-bottom: 1.5px solid #000;">${idx + 1}</td>
                      <td style="border-right: 2px solid #000; border-bottom: 1.5px solid #000;">
                        <div style="font-weight: bold;">${item.name || 'Product'}</div>
                        ${item.content ? `<div style="font-size: 8pt; color: #555; font-style: italic; margin-top: 2px;">${item.content} ${item.category ? `(${item.category})` : ''}</div>` : ''}
                      </td>
                      <td class="text-center" style="border-right: 2px solid #000; border-bottom: 1.5px solid #000;">${item.quantity || 0} box</td>
                      <td class="text-end font-monospace" style="border-right: 2px solid #000; border-bottom: 1.5px solid #000;">₹${(item.originalRate || item.rate || 0).toFixed(2)}</td>
                      <td class="text-end font-monospace" style="font-weight: bold; border-bottom: 1.5px solid #000;">₹${((item.originalRate || item.rate || 0) * (item.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  
                  ${paddingHtml}
                </tbody>
              </table>

              <table class="totals-and-declaration-table" style="width: 100%; border-collapse: collapse; page-break-inside: avoid; break-inside: avoid; border-top: none;">
                <tbody>
                  <tr class="totals-row">
                    <td style="width: 55%; border-right: 2px solid #000; border-bottom: 2px solid #000; text-align: right; font-weight: bold; padding: 8px;">Total</td>
                    <td style="width: 15%; border-right: 2px solid #000; border-bottom: 2px solid #000; text-align: center; font-weight: bold; padding: 8px;">${totalQty}</td>
                    <td style="width: 15%; border-right: 2px solid #000; border-bottom: 2px solid #000; text-align: right; font-weight: bold; padding: 8px;">Sub total</td>
                    <td style="width: 15%; border-bottom: 2px solid #000; text-align: right; font-weight: bold; padding: 8px;" class="font-monospace">₹${subtotal.toFixed(2)}</td>
                  </tr>
                  
                  <tr>
                    <td colSpan="3" style="border-right: 2px solid #000; border-bottom: 1.5px solid #000; text-align: right; font-weight: bold; padding: 6px 8px;">Discount (${discountPct}%)</td>
                    <td style="border-bottom: 1.5px solid #000; text-align: right; color: #d9534f; font-weight: bold; padding: 6px 8px;" class="font-monospace">-₹${discountAmount.toFixed(2)}</td>
                  </tr>
                  
                  <tr>
                    <td colSpan="3" style="border-right: 2px solid #000; border-bottom: 1.5px solid #000; text-align: right; font-weight: bold; padding: 6px 8px;">Discounted Total</td>
                    <td style="border-bottom: 1.5px solid #000; text-align: right; font-weight: bold; padding: 6px 8px;" class="font-monospace">₹${totalAmount.toFixed(2)}</td>
                  </tr>
                  
                  <tr>
                    <td colSpan="3" style="border-right: 2px solid #000; border-bottom: 2px solid #000; text-align: right; font-weight: bold; padding: 6px 8px;">Bill Total</td>
                    <td style="border-bottom: 2px solid #000; text-align: right; font-weight: bold; font-size: 11pt; padding: 6px 8px;" class="font-monospace">₹${totalAmount.toFixed(2)}</td>
                  </tr>

                  <tr class="amount-in-words-row" style="border-bottom: 2px solid #000;">
                    <td colSpan="5" style="border-bottom: 2px solid #000; padding: 10px;">
                      <div style="font-size: 8.5pt; color: #444; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Amount Chargeable (in words):</div>
                      <div style="font-weight: bold; font-size: 9.5pt;">${numberToWords(totalAmount)}</div>
                      <div class="text-end" style="font-size: 8.5pt; color: #555; font-style: italic; margin-top: -10px;">E. & O.E</div>
                    </td>
                  </tr>

                  <tr style="height: 100px;">
                    <td colSpan="3" class="declaration-box" style="border-right: 2px solid #000; padding: 10px; vertical-align: top;">
                      <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">Declaration</div>
                      We declare that this bill shows the actual price of the goods described and that all particulars are true and correct.
                    </td>
                    <td colSpan="2" class="signatory-box" style="padding: 10px; display: flex; flex-direction: column; justify-content: space-between; text-align: right; border: none; height: 100px;">
                      <div style="font-weight: bold; text-transform: uppercase; font-size: 9pt;">For ${companyName}</div>
                      <div style="font-size: 8.5pt; color: #444; margin-top: 45px;">Authorised Signatory</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div class="footer-note">
      *** Composition dealer is not eligible to collect the taxes on supply. ***
    </div>
  </div>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // Print current active bill on screen
  const handlePrint = () => {
    const activeOrder = {
      customerName: customer.name.trim() || 'In-Store Cash Customer',
      customerPhone: customer.phone.trim(),
      customerAddress: customer.address.trim(),
      items: activeBillingItems.map(item => ({
        name: item.name,
        content: item.content,
        category: item.category,
        quantity: parseInt(item.quantity, 10) || 0,
        originalRate: parseFloat(item.originalRate) || 0,
        rate: parseFloat(item.originalRate) || 0
      })),
      subtotalAmount: totals.subtotal,
      discountPercent: discountPercent,
      discountAmount: totals.discountAmount,
      totalAmount: totals.discountedTotal,
      date: new Date(invoiceDate),
      cancellationNote: `Billing Panel ${docType}: ${invoiceNumber}`
    };

    handlePrintOrder(activeOrder);
  };

  // Delete saved bill
  const handleDeleteRecentBill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved bill? This action cannot be undone.')) return;
    try {
      const res = await api.delete(`/orders/${id}`);
      if (res.status === 200 || res.data?.success) {
        fetchRecentBills();
        if (loadData) loadData();
      } else {
        alert('Failed to delete the bill.');
      }
    } catch (err) {
      console.error('Delete bill error:', err);
      alert('Error deleting bill: ' + (err.response?.data?.message || err.message));
    }
  };

  // Blank padding rows calculation (to pad screen invoice to exactly 11 rows like screenshot)
  const paddingRows = useMemo(() => {
    const minRows = 11;
    const currentCount = activeBillingItems.length;
    const needed = Math.max(0, minRows - currentCount);
    return Array.from({ length: needed });
  }, [activeBillingItems]);

  return (
    <div className="admin-section animate-fade-in w-100 p-0 m-0">
      <style>{`
        /* On-Screen Sheet Styling */
        .sheet-outer-container {
          background-color: #f4f6f8;
          padding: 30px 15px;
          min-height: 100vh;
        }

        .bill-sheet {
          background: #ffffff;
          border: 2px solid #222;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          max-width: 900px;
          margin: 0 auto;
          color: #111;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .border-bottom-black {
          border-bottom: 2px solid #222;
        }

        .border-right-black {
          border-right: 2px solid #222;
        }

        /* Screen sheet inputs */
        .sheet-input {
          border: 1px transparent solid;
          background: transparent;
          width: 100%;
          outline: none;
          padding: 2px 4px;
          transition: all 0.2s;
        }

        .sheet-input:focus {
          background-color: #f0f7ff;
          border-color: #a3cbf8;
          border-radius: 4px;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
        }

        .sheet-textarea {
          resize: none;
          min-height: 60px;
        }

        /* Invoice Table */
        .table-invoice {
          width: 100%;
          border-collapse: collapse;
        }

        .table-invoice th {
          border-bottom: 2px solid #222;
          border-right: 2px solid #222;
          padding: 10px 8px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
        }

        .table-invoice td {
          border-bottom: 1px solid #eee;
          border-right: 2px solid #222;
          padding: 6px 8px;
          vertical-align: middle;
          position: relative;
        }

        .table-invoice th:last-child, .table-invoice td:last-child {
          border-right: none;
        }

        /* Autocomplete dropdown overlay */
        .autocomplete-container {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          background: #ffffff;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          z-index: 10000;
          max-height: 250px;
          overflow-y: auto;
        }

        .autocomplete-item {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
          text-align: left;
        }

        .autocomplete-item:hover, .autocomplete-item.active {
          background-color: #0d6efd;
          color: #ffffff;
        }

        .autocomplete-item:hover .text-muted, .autocomplete-item.active .text-muted {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .action-bar {
          background: #ffffff;
          border-bottom: 1px solid #e3e6f0;
          padding: 15px;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}</style>

      {/* Floating Action Buttons Bar (Hidden when printing) */}
      <div className="action-bar d-print-none d-flex justify-content-between align-items-center mb-4 rounded-4 shadow-sm mx-3">
        <div>
          <h4 className="fw-bold m-0 text-primary d-flex align-items-center gap-2">
            <i className="bi bi-receipt-cutoff"></i> A4 Billing Engine
          </h4>
          <p className="text-muted small m-0">Dynamic in-table entry & automated printing layouts</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary rounded-pill px-4 fw-semibold" onClick={handleReset}>
            <i className="bi bi-arrow-counterclockwise me-2"></i>Reset Form
          </button>
          <button className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" onClick={handlePrint} disabled={activeBillingItems.length === 0}>
            <i className="bi bi-printer me-2"></i>Print {docType} (A4)
          </button>
          <button className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm" onClick={handleSaveBill} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
            ) : (
              <><i className="bi bi-cloud-arrow-up me-2"></i>Save Bill</>
            )}
          </button>
        </div>
      </div>

      {/* On-Screen Alerts */}
      <div className="d-print-none px-3">
        {errorMessage && (
          <div className="alert alert-danger alert-dismissible fade show rounded-3 d-flex align-items-center gap-2 mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            <div>{errorMessage}</div>
            <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
          </div>
        )}

        {saveStatus === 'success' && (
          <div className="alert alert-success rounded-3 d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-check-circle-fill fs-5"></i>
            <div>Bill invoice saved successfully as a completed enquiry/order!</div>
          </div>
        )}
      </div>

      {/* The Printable A4 Sheet */}
      <div className="sheet-outer-container w-100 d-print-none">
        <div className="bill-sheet p-4 p-md-5">
          <div className="border border-dark">
            {/* Title at top center */}
            <div className="text-center border-bottom border-dark py-1 fw-bold text-uppercase tracking-wider" style={{ fontSize: '11pt' }}>
              {docType === 'Estimate' ? 'Estimate' : 'Tax Invoice'}
            </div>

            {/* Header: Logo + Brand Info */}
            <div className="row g-0 border-bottom border-dark align-items-center">
              <div className="col-3 border-right-black p-3 text-center d-flex align-items-center justify-content-center" style={{ minHeight: '120px' }}>
                <div className="p-1 border border-dark rounded-3 d-flex align-items-center justify-content-center overflow-hidden bg-white" style={{ width: '85px', height: '85px' }}>
                  <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
              <div className="col-9 p-3 text-center">
                <input
                  type="text"
                  className="sheet-input text-center fw-bold text-uppercase fs-4 mb-1"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="KAVIYA CRACKERS"
                />
                <textarea
                  className="sheet-input sheet-textarea text-center small text-muted lh-sm"
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                  placeholder="Address details"
                />
                <div className="text-center small fw-semibold mt-1">
                  Ph : <input
                    type="text"
                    className="sheet-input fw-semibold text-center d-inline-block"
                    style={{ width: '150px' }}
                    value={companyPhone}
                    onChange={e => setCompanyPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            {/* Middle split: Buyer Info (Left) + Invoice Info (Right) */}
            <div className="row g-0 border-bottom border-dark" style={{ minHeight: '130px' }}>
              {/* Buyer Box */}
              <div className="col-7 border-right-black p-3 text-start">
                <div className="fw-bold border-bottom pb-1 mb-2 text-uppercase text-muted small" style={{ fontSize: '8.5pt' }}>Buyer</div>
                <input
                  type="text"
                  className="sheet-input fw-bold fs-6 mb-1"
                  value={customer.name}
                  onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Customer Name (Required)"
                />
                <textarea
                  className="sheet-input sheet-textarea text-muted small lh-sm"
                  style={{ minHeight: '50px' }}
                  value={customer.address}
                  onChange={e => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="Delivery Address"
                />
                <div className="small text-muted mt-1">
                  Ph : <input
                    type="text"
                    className="sheet-input d-inline-block"
                    style={{ width: '150px' }}
                    value={customer.phone}
                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="Phone"
                  />
                </div>
              </div>

              {/* Invoice Meta Box */}
              <div className="col-5 p-3 text-start d-flex flex-column justify-content-between">
                <div className="mb-2">
                  <div className="d-flex align-items-center mb-2">
                    <select
                      className="form-select form-select-sm fw-bold border border-secondary rounded me-2 py-0 px-1"
                      style={{ width: '100px', fontSize: '9pt' }}
                      value={docType}
                      onChange={e => handleDocTypeChange(e.target.value)}
                    >
                      <option value="Estimate">Estimate</option>
                      <option value="Invoice">Invoice</option>
                    </select>
                    <span className="me-1">:</span>
                    <input
                      type="text"
                      className="sheet-input fw-bold"
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      placeholder="Doc Number"
                    />
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="small fw-semibold text-nowrap me-2" style={{ minWidth: '100px' }}>Dated</span>
                    <span className="me-1">:</span>
                    <input
                      type="date"
                      className="sheet-input"
                      value={invoiceDate}
                      onChange={e => setInvoiceDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="w-100">
              <table className="table-invoice">
                <thead>
                  <tr className="text-center text-uppercase">
                    <th style={{ width: '50px' }}>S.No</th>
                    <th>Products</th>
                    <th style={{ width: '110px' }}>Qty</th>
                    <th style={{ width: '130px' }}>Rate</th>
                    <th style={{ width: '140px' }}>Amount</th>
                    <th style={{ width: '60px' }} className="d-print-none">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billingItems.map((item, index) => (
                    <tr key={index}>
                      {/* S.No */}
                      <td className="text-center fw-semibold text-muted py-2">{index + 1}</td>

                      {/* Products (Autocomplete input) */}
                      <td style={{ position: 'relative' }}>
                        <input
                          id={`product-${index}`}
                          type="text"
                          className="sheet-input fw-bold p-0"
                          value={item.name}
                          onChange={e => handleProductInputChange(index, e.target.value)}
                          onFocus={() => {
                            setActiveRowIndex(index);
                            setShowDropdown(true);
                          }}
                          onKeyDown={e => handleKeyDown(index, e)}
                          placeholder="Type product name..."
                          autoComplete="off"
                        />
                        {item.content && (
                          <div className="text-muted small mt-1" style={{ fontSize: '8.5pt', fontStyle: 'italic' }}>
                            {item.content} {item.category && `(${item.category})`}
                          </div>
                        )}

                        {/* Autocomplete Overlay */}
                        {activeRowIndex === index && showDropdown && (
                          <div className="autocomplete-container" ref={dropdownRef}>
                            {filteredProducts.length === 0 ? (
                              <div className="p-3 text-center text-muted small">No items match search.</div>
                            ) : (
                              filteredProducts.map((p, pIdx) => (
                                <div
                                  key={p._id || p.id}
                                  className={`autocomplete-item ${selectedAutocompleteIndex === pIdx ? 'active' : ''}`}
                                  onClick={() => handleSelectProduct(index, p)}
                                  onMouseEnter={() => setSelectedAutocompleteIndex(pIdx)}
                                >
                                  <div className="fw-bold">{p.name}</div>
                                  <div className="small text-muted d-flex justify-content-between">
                                    <span>Category: {p.category} | Content: {p.content}</span>
                                    <span className="fw-bold text-primary">MRP: ₹{Number(p.originalRate || p.rate || 0).toFixed(2)}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center">
                          <input
                            id={`qty-${index}`}
                            type="number"
                            className="sheet-input text-center fw-bold me-1"
                            style={{ width: '60px' }}
                            min="1"
                            value={item.quantity}
                            onChange={e => handleQtyChange(index, e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const nextInput = document.getElementById(`product-${index + 1}`);
                                if (nextInput) {
                                  nextInput.focus();
                                } else {
                                  handleAddRow();
                                  setTimeout(() => {
                                    const newRowInput = document.getElementById(`product-${index + 1}`);
                                    if (newRowInput) newRowInput.focus();
                                  }, 50);
                                }
                              }
                            }}
                            placeholder="0"
                          />
                          <span className="small text-muted">box</span>
                        </div>
                      </td>

                      {/* Rate (MRP) */}
                      <td>
                        <div className="d-flex align-items-center justify-content-end font-monospace">
                          <span className="me-1">₹</span>
                          <input
                            type="number"
                            className="sheet-input text-end"
                            style={{ width: '80px' }}
                            value={item.originalRate}
                            onChange={e => handleRateChange(index, e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="text-end font-monospace py-2 pe-3 fw-semibold">
                        ₹{(item.amount || 0).toFixed(2)}
                      </td>

                      {/* Dedicated Visible Delete Button Column */}
                      <td className="text-center d-print-none">
                        <button 
                          className="btn btn-sm btn-link text-danger p-0 border-0 bg-transparent"
                          onClick={() => handleRemoveRow(index)}
                          title="Delete row"
                        >
                          <i className="bi bi-trash fs-5"></i>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Print Padding Rows */}
                  {paddingRows.map((_, pIdx) => (
                    <tr key={`pad-${pIdx}`} style={{ height: '35px' }}>
                      <td className="border-right-black"></td>
                      <td className="border-right-black"></td>
                      <td className="border-right-black"></td>
                      <td className="border-right-black"></td>
                      <td></td>
                      <td className="d-print-none"></td>
                    </tr>
                  ))}

                  {/* Grand Totals Section */}
                  <tr className="footer-total-row border-top border-dark border-2">
                    <td colSpan="2" className="text-end fw-bold py-2 border-right-black">Total</td>
                    <td className="text-center fw-bold py-2 border-right-black">{totals.totalQty}</td>
                    <td className="text-end fw-bold py-2 border-right-black">Sub total</td>
                    <td className="text-end fw-bold py-2 font-monospace pe-3">₹{totals.subtotal.toFixed(2)}</td>
                    <td className="d-print-none"></td>
                  </tr>

                  {/* Discount percentage input row */}
                  <tr>
                    <td colSpan="4" className="text-end fw-bold py-2 border-right-black">
                      Discount (
                      <input
                        type="number"
                        className="sheet-input d-inline-block text-center fw-bold text-danger"
                        style={{ width: '45px', borderBottom: '1px dashed #dc3545' }}
                        value={discountPercent}
                        onChange={e => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      />
                      %)
                    </td>
                    <td className="text-end fw-bold py-2 font-monospace text-danger pe-3">
                      -₹{totals.discountAmount.toFixed(2)}
                    </td>
                    <td className="d-print-none"></td>
                  </tr>

                  {/* Discounted Total */}
                  <tr>
                    <td colSpan="4" className="text-end fw-bold py-2 border-right-black">Discounted Total</td>
                    <td className="text-end fw-bold py-2 font-monospace pe-3">₹{totals.discountedTotal.toFixed(2)}</td>
                    <td className="d-print-none"></td>
                  </tr>

                  {/* Bill Total */}
                  <tr className="border-bottom border-dark border-2">
                    <td colSpan="4" className="text-end fw-bold py-2 border-right-black">Bill Total</td>
                    <td className="text-end fw-bold py-2 font-monospace pe-3" style={{ fontSize: '11pt' }}>₹{totals.discountedTotal.toFixed(2)}</td>
                    <td className="d-print-none"></td>
                  </tr>

                  {/* Amount in words */}
                  <tr className="border-bottom border-dark">
                    <td colSpan="5" className="p-3 text-start">
                      <div className="small fw-semibold text-uppercase text-muted mb-1">Amount Chargeable (in words):</div>
                      <div className="fw-bold" style={{ fontSize: '9.5pt' }}>
                        {numberToWords(totals.discountedTotal)}
                      </div>
                      <div className="text-end w-100 small text-muted" style={{ marginTop: '-15px', fontStyle: 'italic' }}>E. & O.E</div>
                    </td>
                    <td className="d-print-none"></td>
                  </tr>

                  {/* Declaration and Signature block */}
                  <tr>
                    <td colSpan="3" className="p-3 text-start border-right-black" style={{ verticalAlign: 'top', width: '55%' }}>
                      <div className="fw-bold text-decoration-underline small mb-1">Declaration</div>
                      <p className="m-0 text-muted" style={{ fontSize: '8pt', lineHeight: '1.4' }}>
                        We declare that this bill shows the actual price of the goods described and that all particulars are true and correct.
                      </p>
                    </td>
                    <td colSpan="2" className="p-3 text-end d-flex flex-column justify-content-between" style={{ minHeight: '100px' }}>
                      <div className="fw-bold text-uppercase small">For {companyName}</div>
                      <div className="small text-muted mt-4">Authorised Signatory</div>
                    </td>
                    <td className="d-print-none"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-3 small text-muted fw-bold">
            *** Composition dealer is not eligible to collect the taxes on supply. ***
          </div>
        </div>
      </div>

      {/* Recent Bills Section (Screen only) */}
      <div className="container-fluid mt-5 mb-5 d-print-none" style={{ maxWidth: '900px' }}>
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-header bg-white border-bottom border-light py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="m-0 fw-bold text-primary d-flex align-items-center gap-2">
              <i className="bi bi-clock-history"></i> Recent In-Store Bills
            </h5>
            <span className="badge bg-secondary rounded-pill px-3">{recentBills.length} Bills</span>
          </div>
          <div className="card-body p-0">
            {recentBills.length === 0 ? (
              <div className="p-5 text-center text-muted">
                <i className="bi bi-folder2-open fs-2 d-block mb-2"></i>
                <span>No saved bills found.</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4">Date</th>
                      <th>Document No</th>
                      <th>Buyer Name</th>
                      <th className="text-center">Items</th>
                      <th className="text-end">Total Amount</th>
                      <th className="text-center" style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBills.map(bill => {
                      const billDate = new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
                      const docNo = bill.cancellationNote && bill.cancellationNote.includes('Billing Panel')
                        ? bill.cancellationNote.split(':').pop().trim()
                        : (bill.cancellationNote && bill.cancellationNote.includes('Invoice:')
                            ? bill.cancellationNote.split('Invoice:').pop().trim()
                            : `EST-${String(bill._id).slice(-6).toUpperCase()}`);

                      return (
                        <tr key={bill._id}>
                          <td className="ps-4 small text-muted">{billDate}</td>
                          <td className="fw-semibold">{docNo}</td>
                          <td>{bill.customerName || 'In-Store Customer'}</td>
                          <td className="text-center font-monospace">{bill.items ? bill.items.length : 0}</td>
                          <td className="text-end fw-bold font-monospace pe-3">₹{bill.totalAmount ? bill.totalAmount.toFixed(2) : '0.00'}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-primary rounded-circle p-1 me-2" onClick={() => handlePrintOrder(bill)} title="Print Bill">
                              <i className="bi bi-printer"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger rounded-circle p-1" onClick={() => handleDeleteRecentBill(bill._id)} title="Delete Bill">
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSection;
