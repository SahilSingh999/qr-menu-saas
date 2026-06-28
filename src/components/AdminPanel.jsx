import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useCurrency } from '../context/CurrencyContext';

export default function AdminPanel() {
  const {
    loading,
    error,
    setError,
    fetchCafes,
    createCafe,
    updateCafe,
    deleteCafe,
    fetchMenuItems,
    createMenuItem,
    deleteMenuItem,
    updateMenuItem,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    subscribeToOrders,
    uploadImage,
    fetchStaff,
    createStaff,
    deleteStaff
  } = useSupabase();

  // State
  const { formatPrice, currency, currencies, currencyCode, setCurrencyCode } = useCurrency();
  const [activeTab, setActiveTab] = useState('cafes');
  const [cafes, setCafes] = useState([]);
  const [selectedCafe, setSelectedCafe] = useState(null);

  // Authentication & Session States
  const [cafeAdminPassword, setCafeAdminPassword] = useState('');
  const [adminSession, setAdminSession] = useState(() => {
    const saved = localStorage.getItem('admin_session_cafe_id');
    return saved ? parseInt(saved) : null;
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginCafeId, setLoginCafeId] = useState('');

  // Staff States
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('waiter');
  const [staffPin, setStaffPin] = useState('');
  const [staffList, setStaffList] = useState([]);

  const displayedCafes = adminSession ? cafes.filter(c => c.id === adminSession) : cafes;
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);

  // Form States - Cafes
  const [cafeName, setCafeName] = useState('');
  const [cafeDescription, setCafeDescription] = useState('');
  const [cafeLocation, setCafeLocation] = useState('');
  const [cafeLogoUrl, setCafeLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [cafeThemeColor, setCafeThemeColor] = useState('#00f2fe');
  const [cafeTableCount, setCafeTableCount] = useState(10);
  const [qrBaseUrl, setQrBaseUrl] = useState(window.location.origin);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogoPreview = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  // Form States - Menu
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Main');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [portionInput, setPortionInput] = useState('');
  const [portionsList, setPortionsList] = useState([]);
  const [itemFile, setItemFile] = useState(null);
  const [itemPreview, setItemPreview] = useState('');

  // Target cafe branch for menu item — independent of global selectedCafe
  const [menuTargetCafe, setMenuTargetCafe] = useState(null);

  // Discount config states
  const [discountMinItems, setDiscountMinItems] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  const handleUpdateDiscount = async (e) => {
    e.preventDefault();
    if (!menuTargetCafe) return;
    const targetId = menuTargetCafe.id;
    const updated = await updateCafe(targetId, {
      discount_min_items: parseInt(discountMinItems) || 0,
      discount_percentage: parseInt(discountPercentage) || 0
    });
    if (updated) {
      setCafes(prev => prev.map(c => c.id === targetId ? updated : c));
      setMenuTargetCafe(updated);
      if (selectedCafe?.id === targetId) setSelectedCafe(updated);
      showAdminAlert('Discount settings updated successfully!');
    }
  };

  // Confirm / alert state (iOS-safe, no browser dialogs)
  const [deleteCafeConfirmId, setDeleteCafeConfirmId] = useState(null);
  const [deleteItemConfirmId, setDeleteItemConfirmId] = useState(null);
  const [cancelOrderConfirmId, setCancelOrderConfirmId] = useState(null);
  const [deleteOrderConfirmId, setDeleteOrderConfirmId] = useState(null);
  const [adminAlertMsg, setAdminAlertMsg] = useState('');

  const showAdminAlert = (msg) => {
    setAdminAlertMsg(msg);
    setTimeout(() => setAdminAlertMsg(''), 3500);
  };

  const handleItemFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setItemFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveItemPreview = () => {
    setItemFile(null);
    setItemPreview('');
  };

  // Form States - Test Order
  const [orderTable, setOrderTable] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // Array of { item, quantity }
  const [customOrderText, setCustomOrderText] = useState('');

  // Fetch initial data (Cafes)
  useEffect(() => {
    loadCafes();
  }, []);

  // Fetch Cafe-specific data (Menu and Orders) and subscribe to realtime orders
  useEffect(() => {
    if (selectedCafe) {
      setMenuTargetCafe(selectedCafe);
      setDiscountMinItems(selectedCafe.discount_min_items || 0);
      setDiscountPercentage(selectedCafe.discount_percentage || 0);
      loadMenuItems(selectedCafe.id);
      loadOrders(selectedCafe.id);

      // Subscribe to realtime orders for the selected cafe
      const unsubscribe = subscribeToOrders(selectedCafe.id, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(order => order.id === payload.new.id ? payload.new : order));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(order => order.id !== payload.old.id));
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      setMenuItems([]);
      setOrders([]);
    }
  }, [selectedCafe]);

  // Data Loading Helpers
  const loadCafes = async () => {
    const data = await fetchCafes();
    if (data) {
      setCafes(data);
      const savedSession = localStorage.getItem('admin_session_cafe_id');
      if (savedSession && data.length > 0) {
        const target = data.find(c => String(c.id) === String(savedSession));
        if (target) {
          setSelectedCafe(target);
          setAdminSession(target.id);
          return;
        }
      }
      if (data.length > 0 && !selectedCafe) {
        setSelectedCafe(data[0]);
      }
    }
  };

  const loadMenuItems = async (cafeId) => {
    const data = await fetchMenuItems(cafeId);
    if (data) setMenuItems(data);
  };

  const loadOrders = async (cafeId) => {
    const data = await fetchOrders(cafeId);
    if (data) setOrders(data);
  };

  // Staff Management Hooks
  useEffect(() => {
    if (selectedCafe && activeTab === 'staff') {
      loadStaff(selectedCafe.id);
    }
  }, [selectedCafe, activeTab]);

  const loadStaff = async (cafeId) => {
    const data = await fetchStaff(cafeId);
    if (data) setStaffList(data);
  };

  const handleAdminLogin = () => {
    if (!loginCafeId) {
      setAdminAlertMsg('Please select a Cafe Branch.');
      return;
    }
    const target = cafes.find(c => String(c.id) === String(loginCafeId));
    if (target) {
      const correctPassword = target.admin_password || 'admin123';
      if (loginPassword === correctPassword) {
        setAdminSession(target.id);
        setSelectedCafe(target);
        localStorage.setItem('admin_session_cafe_id', String(target.id));
        setLoginPassword('');
        setAdminAlertMsg('');
      } else {
        setAdminAlertMsg('❌ Incorrect admin password. Please try again.');
      }
    }
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    setSelectedCafe(null);
    localStorage.removeItem('admin_session_cafe_id');
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!staffName.trim() || staffPin.length !== 4) {
      setAdminAlertMsg('Name is required and PIN must be exactly 4 digits.');
      return;
    }
    const newStaff = {
      cafe_id: selectedCafe.id,
      name: staffName,
      role: staffRole,
      pin: staffPin
    };
    const created = await createStaff(newStaff);
    if (created) {
      setStaffList(prev => [...prev, created]);
      setStaffName('');
      setStaffPin('');
      setStaffRole('waiter');
      setAdminAlertMsg('');
    }
  };

  const handleDeleteStaff = async (id) => {
    const deleted = await deleteStaff(id);
    if (deleted) {
      setStaffList(prev => prev.filter(s => s.id !== id));
    }
  };

  // CRUD Handler - Cafe
  const handleCreateCafe = async (e) => {
    e.preventDefault();
    if (!cafeName.trim()) return;

    let finalLogoUrl = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=60';
    if (logoFile) {
      finalLogoUrl = await uploadImage(logoFile, 'logos');
    } else if (cafeLogoUrl.trim()) {
      finalLogoUrl = cafeLogoUrl;
    }

    const newCafe = {
      name: cafeName,
      description: cafeDescription,
      location: cafeLocation,
      logo_url: finalLogoUrl,
      theme_color: cafeThemeColor,
      table_count: parseInt(cafeTableCount) || 10,
      admin_password: cafeAdminPassword || 'admin123'
    };

    const created = await createCafe(newCafe);
    if (created) {
      setCafes(prev => [...prev, created]);
      setSelectedCafe(created);
      setCafeName('');
      setCafeDescription('');
      setCafeLocation('');
      setCafeLogoUrl('');
      setLogoFile(null);
      setLogoPreview('');
      setCafeThemeColor('#00f2fe');
      setCafeTableCount(10);
      setCafeAdminPassword('');
    }
  };

  const handleDeleteCafe = async (id) => {
    if (deleteCafeConfirmId !== id) { setDeleteCafeConfirmId(id); return; }
    setDeleteCafeConfirmId(null);
    const success = await deleteCafe(id);
    if (success) {
      setCafes(prev => prev.filter(c => c.id !== id));
      if (selectedCafe?.id === id) {
        setSelectedCafe(null);
      }
    }
  };

  // CRUD Handler - Menu Item
  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice.trim()) return;

    let finalImageUrl = '';
    if (itemFile) {
      finalImageUrl = await uploadImage(itemFile, 'menu_items');
    }

    const newItem = {
      cafe_id: (menuTargetCafe || selectedCafe).id,
      name: itemName,
      category: itemCategory,
      price: parseFloat(itemPrice),
      description: itemDescription,
      is_available: itemAvailable,
      is_veg: itemIsVeg,
      portion_options: portionsList,
      image_url: finalImageUrl
    };

    const created = await createMenuItem(newItem);
    if (created) {
      setMenuItems(prev => [...prev, created]);
      setItemName('');
      setItemCategory('Main');
      setItemPrice('');
      setItemDescription('');
      setItemAvailable(true);
      setItemIsVeg(true);
      setPortionsList([]);
      setPortionInput('');
      setItemFile(null);
      setItemPreview('');
    }
  };

  const handleAvailabilityChange = async (item, newStatus) => {
    // Map the new string status back to is_available for backward compatibility,
    // and also store the specific status string.
    const is_available = newStatus === 'available' || newStatus === 'time_taking';
    
    const updated = await updateMenuItem(item.id, { 
      is_available,
      availability_status: newStatus
    });
    
    if (updated) {
      setMenuItems(prev => prev.map(m => m.id === item.id ? updated : m));
    } else {
      // Fallback in case of DB schema issues
      setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, is_available, availability_status: newStatus } : m));
    }
  };

  const handleDeleteMenuItem = async (id) => {
    if (deleteItemConfirmId !== id) { setDeleteItemConfirmId(id); return; }
    setDeleteItemConfirmId(null);
    const success = await deleteMenuItem(id);
    if (success) {
      setMenuItems(prev => prev.filter(m => m.id !== id));
    }
  };

  // Portion helpers
  const handleAddPortion = () => {
    const val = portionInput.trim();
    if (val && !portionsList.includes(val)) {
      setPortionsList([...portionsList, val]);
      setPortionInput('');
    }
  };

  const handleRemovePortion = (val) => {
    setPortionsList(portionsList.filter(p => p !== val));
  };

  // CRUD Handler - Order Simulator
  const handleSelectItemChange = (item, quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) {
      setSelectedItems(prev => prev.filter(si => si.item.id !== item.id));
    } else {
      setSelectedItems(prev => {
        const existing = prev.find(si => si.item.id === item.id);
        if (existing) {
          return prev.map(si => si.item.id === item.id ? { ...si, quantity: qty } : si);
        }
        return [...prev, { item, quantity: qty }];
      });
    }
  };

  const handleCreateTestOrder = async (e) => {
    e.preventDefault();
    if (!selectedCafe) return;

    let itemsStr = '';
    let total = 0;

    if (selectedItems.length > 0) {
      itemsStr = selectedItems.map(si => `${si.quantity}x ${si.item.name}`).join(', ');
      total = selectedItems.reduce((acc, si) => acc + (si.item.price * si.quantity), 0);
    } else if (customOrderText.trim()) {
      itemsStr = customOrderText;
      total = 15.0; // Mock price for custom string orders
    } else {
      showAdminAlert('Please select items or write custom text first!');
      return;
    }

    const newOrder = {
      cafe_id: selectedCafe.id,
      table_number: orderTable || '7',
      items: itemsStr,
      total_price: total,
      status: 'pending'
    };

    const created = await createOrder(newOrder);
    if (created) {
      setOrders(prev => [created, ...prev]);
      setOrderTable('');
      setSelectedItems([]);
      setCustomOrderText('');
    }
  };

  const handleUpdateOrderStatus = async (id, currentStatus) => {
    let nextStatus = 'pending';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'completed';

    const updated = await updateOrderStatus(id, nextStatus);
    if (updated) {
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
    }
  };

  const handleCancelOrder = async (id) => {
    if (cancelOrderConfirmId !== id) { setCancelOrderConfirmId(id); return; }
    setCancelOrderConfirmId(null);
    const updated = await updateOrderStatus(id, 'cancelled');
    if (updated) {
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
    }
  };

  const handleDeleteOrder = async (id) => {
    if (deleteOrderConfirmId !== id) { setDeleteOrderConfirmId(id); return; }
    setDeleteOrderConfirmId(null);
    const success = await deleteOrder(id);
    if (success) {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  // Sales Export Feature
  const [salesPeriod, setSalesPeriod] = useState('monthly');

  const exportSalesData = () => {
    if (!orders.length) return;
    const now = new Date();
    const filtered = orders.filter(order => {
      const d = new Date(order.created_at);
      if (salesPeriod === 'weekly') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      } else if (salesPeriod === 'monthly') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else {
        return d.getFullYear() === now.getFullYear();
      }
    });

    const rows = [
      ['Order ID', 'Table', 'Items', `Total (${currency.symbol})`, 'Status', 'Date & Time'],
      ...filtered.map(o => [
        o.id,
        o.table_number,
        `"${o.items}"`,
        parseFloat(o.total_price || 0).toFixed(2),
        o.status,
        new Date(o.created_at).toLocaleString()
      ])
    ];

    const totalRevenue = filtered.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
    rows.push([]);
    rows.push(['SUMMARY', '', '', '', '', '']);
    rows.push([`Period`, salesPeriod.toUpperCase(), '', '', '', '']);
    rows.push([`Total Orders`, filtered.length, '', '', '', '']);
    rows.push([`Total Revenue (${currency.symbol})`, totalRevenue.toFixed(2), '', '', '', '']);

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCafe?.name || 'cafe'}_sales_${salesPeriod}_${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (cafes.length > 0 && !adminSession) {
    return (
      <div className="view-pane-container animated-fade-in no-print-workspace" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
        <div className="form-card glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem 2rem', position: 'static' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>🔐 Cafe Owner Access</h2>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.4' }}>
            Please select your Cafe Branch and enter your Admin Password to manage your catalog and orders.
          </p>
          {adminAlertMsg && <div className="alert alert-error" style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>{adminAlertMsg}</div>}
          <div className="form-group">
            <label>Select Cafe Branch</label>
            <select value={loginCafeId} onChange={(e) => setLoginCafeId(e.target.value)}>
              <option value="">-- Select Cafe --</option>
              {cafes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Admin Password</label>
            <input 
              type="password" 
              placeholder="Enter admin password" 
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
            />
          </div>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleAdminLogin}
            style={{ width: '100%' }}
          >
            Access Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-pane-container animated-fade-in no-print-workspace">
      {/* SaaS Admin Header */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="admin-page-title-block">
          <div className="admin-title-eyebrow">QR MENU SAAS — PORTAL</div>
          <h1 className="admin-page-h1">Portal Console</h1>
          <p className="admin-sub" style={{ margin: 0 }}>Manage cafes, generate QR stickers, configure menus &amp; simulate live table events.</p>
        </div>

        {adminSession && (
          <button 
            className="btn-select" 
            onClick={handleAdminLogout} 
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}
          >
            🚪 Log Out Cafe
          </button>
        )}

        {/* Selected Cafe Card — expanded with location + details */}
        {selectedCafe && (
          <div className="admin-cafe-chip-card glass-card">
            <div className="cafe-chip-status-row">
              <div className="cafe-chip-active-dot"></div>
              <span className="cafe-chip-label">Active Workspace</span>
            </div>
            <div className="cafe-chip-body">
              <img
                src={selectedCafe.logo_url}
                alt={selectedCafe.name}
                className="cafe-chip-logo-lg"
              />
              <div className="cafe-chip-info">
                <span className="cafe-chip-name-lg">{selectedCafe.name}</span>
                {selectedCafe.location && (
                  <span className="cafe-chip-location">📍 {selectedCafe.location}</span>
                )}
                <span className="cafe-chip-meta">
                  {selectedCafe.table_count || '—'} Tables &nbsp;·&nbsp; {menuItems.length} Menu Items
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Toast Alert Banner */}
      {adminAlertMsg && (
        <div className="admin-alert-banner animated-slide-down">
          <span>⚠️ {adminAlertMsg}</span>
          <button className="admin-alert-close" onClick={() => setAdminAlertMsg('')}>×</button>
        </div>
      )}

      {/* Global Stat Row */}
      <section className="stats-row">
        <div className="stat-card glass-card">
          <div className="stat-icon icon-cafe">🏠</div>
          <div className="stat-info">
            <h3>Total Cafes</h3>
            <p className="stat-number">{cafes.length}</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon icon-menu">🍔</div>
          <div className="stat-info">
            <h3>Menu Items</h3>
            <p className="stat-number">
              {selectedCafe ? menuItems.length : '-'}
            </p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon icon-orders">⚡</div>
          <div className="stat-info">
            <h3>Live Orders</h3>
            <p className="stat-number">
              {selectedCafe ? orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'bill_approved').length : '-'}
            </p>
          </div>
        </div>
      </section>

      {/* Configuration & Management Area */}
      <div className="tabs-container">
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'cafes' ? 'active' : ''}`}
            onClick={() => setActiveTab('cafes')}
          >
            🏠 Cafes Manager
          </button>
          <button 
            className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            👥 Staff & PINs
          </button>
          <button 
            className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🍔 Menu Manager
          </button>
          <button 
            className={`tab-btn ${activeTab === 'qr_stickers' ? 'active' : ''}`}
            onClick={() => setActiveTab('qr_stickers')}
          >
            🖨️ QR & Stickers
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Order Simulator
          </button>
          <button
            className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            📊 Sales Report
          </button>
        </div>
      </div>

      <div className="tab-content">
        {/* STAFF & PINS TAB */}
        {activeTab === 'staff' && (
          !selectedCafe ? (
            <div className="alert-select-cafe glass-card">
              <p>⚠️ Please create or select a cafe to manage staff members.</p>
            </div>
          ) : (
            <div className="pane-layout">
              {/* Add Staff Form */}
              <div className="form-card glass-card">
                <h2>👥 Add Staff Member</h2>
                <form onSubmit={handleCreateStaff}>
                  <div className="form-group">
                    <label>Staff Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe" 
                      value={staffName} 
                      onChange={(e) => setStaffName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                      <option value="waiter">Waiter</option>
                      <option value="chef">Kitchen Chef</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Login PIN (4 digits) *</label>
                    <input 
                      type="text" 
                      maxLength="4"
                      placeholder="e.g. 1234" 
                      value={staffPin} 
                      onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                    Create Staff Member
                  </button>
                </form>
              </div>

              {/* Staff Directory */}
              <div className="list-card glass-card">
                <h2>Staff Directory ({staffList.length} staff)</h2>
                {staffList.length === 0 ? (
                  <div className="empty-state">
                    <p>No staff members registered. Add waiters/chefs to log in!</p>
                  </div>
                ) : (
                  <div className="menu-list-grid">
                    {staffList.map(member => (
                      <div key={member.id} className="menu-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>👤 {member.name}</h3>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Role: <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{member.role}</span> &nbsp;·&nbsp; PIN: <code>{member.pin}</code>
                          </p>
                        </div>
                        <button 
                          className="btn-delete-icon" 
                          type="button"
                          onClick={() => handleDeleteStaff(member.id)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem' }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {/* SALES REPORT TAB */}
        {activeTab === 'sales' && (
          <div className="sales-report-pane glass-card">
            <div className="sales-report-header">
              <div>
                <h2>📊 Sales Report Export</h2>
                <p className="admin-sub">
                  {selectedCafe ? `Showing data for ${selectedCafe.name}${selectedCafe.location ? ` · ${selectedCafe.location}` : ''}` : 'Select a cafe to view sales.'}
                </p>
              </div>
              {selectedCafe && (
                <button className="btn-export-excel" onClick={exportSalesData} disabled={!orders.length}>
                  ⬇ Download CSV
                </button>
              )}
            </div>

            {selectedCafe ? (
              <>
                {/* Period Toggle */}
                <div className="sales-period-toggle">
                  {['weekly', 'monthly', 'yearly'].map(p => (
                    <button
                      key={p}
                      className={`period-btn ${salesPeriod === p ? 'active' : ''}`}
                      onClick={() => setSalesPeriod(p)}
                    >
                      {p === 'weekly' ? '7 Days' : p === 'monthly' ? 'This Month' : 'This Year'}
                    </button>
                  ))}
                </div>

                {/* Summary Cards */}
                {(() => {
                  const now = new Date();
                  const filtered = orders.filter(order => {
                    const d = new Date(order.created_at);
                    if (salesPeriod === 'weekly') {
                      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
                      return d >= weekAgo;
                    } else if (salesPeriod === 'monthly') {
                      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    } else {
                      return d.getFullYear() === now.getFullYear();
                    }
                  });
                  const completed = filtered.filter(o => ['completed', 'bill_approved'].includes(o.status));
                  const revenue = completed.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                  const avgOrder = completed.length ? (revenue / completed.length) : 0;

                  return (
                    <>
                      <div className="sales-summary-grid">
                        <div className="sales-stat-card">
                          <span className="sales-stat-icon">🧾</span>
                          <div>
                            <p className="sales-stat-label">Total Orders</p>
                            <p className="sales-stat-value">{filtered.length}</p>
                          </div>
                        </div>
                        <div className="sales-stat-card">
                          <span className="sales-stat-icon">✅</span>
                          <div>
                            <p className="sales-stat-label">Completed</p>
                            <p className="sales-stat-value">{completed.length}</p>
                          </div>
                        </div>
                        <div className="sales-stat-card highlight">
                          <span className="sales-stat-icon">💰</span>
                          <div>
                            <p className="sales-stat-label">Total Revenue</p>
                            <p className="sales-stat-value">{formatPrice(revenue)}</p>
                          </div>
                        </div>
                        <div className="sales-stat-card">
                          <span className="sales-stat-icon">📈</span>
                          <div>
                            <p className="sales-stat-label">Avg. Order Value</p>
                            <p className="sales-stat-value">{formatPrice(avgOrder)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Orders Preview Table */}
                      <div className="sales-table-wrapper">
                        <table className="sales-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Table</th>
                              <th>Items</th>
                              <th>Total</th>
                              <th>Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 ? (
                              <tr><td colSpan="6" className="sales-empty-row">No orders found for this period.</td></tr>
                            ) : (
                              filtered.slice(0, 20).map(o => (
                                <tr key={o.id}>
                                  <td className="order-id-cell">#{String(o.id).slice(-4)}</td>
                                  <td>Table {o.table_number}</td>
                                  <td className="items-cell">{o.items}</td>
                                  <td className="total-cell">{formatPrice(o.total_price || 0)}</td>
                                  <td><span className={`status-pill status-${o.status}`}>{o.status}</span></td>
                                  <td className="date-cell">{new Date(o.created_at).toLocaleDateString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                        {filtered.length > 20 && (
                          <p className="sales-table-footer">Showing 20 of {filtered.length} orders. Download CSV for full data.</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="empty-state">
                <p>⚠️ Please select a cafe from the Cafes tab to view sales data.</p>
              </div>
            )}
          </div>
        )}

        {/* CAFES TAB */}
        {activeTab === 'cafes' && (
          <div className="pane-layout">
            <div className="form-card glass-card">
              <h2>Create New Cafe</h2>
              <form onSubmit={handleCreateCafe}>
                <div className="form-group">
                  <label>Cafe Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bella Italia Bistro" 
                    value={cafeName} 
                    onChange={(e) => setCafeName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Location / City</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rome, Italy" 
                    value={cafeLocation} 
                    onChange={(e) => setCafeLocation(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    placeholder="Brief description of the cafe..." 
                    value={cafeDescription} 
                    onChange={(e) => setCafeDescription(e.target.value)}
                    rows="3"
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Tables Count *</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    placeholder="Number of tables (e.g. 10)" 
                    value={cafeTableCount} 
                    onChange={(e) => setCafeTableCount(parseInt(e.target.value) || 1)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Admin Access Password *</label>
                  <input 
                    type="password" 
                    placeholder="Set password for this cafe admin portal" 
                    value={cafeAdminPassword} 
                    onChange={(e) => setCafeAdminPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Cafe Logo Image</label>
                  <div className="file-upload-wrapper">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      id="cafeLogoFile"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="cafeLogoFile" className="btn-select file-upload-btn">
                      📂 Choose Image File
                    </label>
                    {logoPreview ? (
                      <div className="logo-preview-container">
                        <img src={logoPreview} alt="Logo preview" className="logo-preview-img" />
                        <button type="button" className="remove-preview-btn" onClick={handleRemoveLogoPreview}>×</button>
                      </div>
                    ) : (
                      <span className="file-name-label">No file selected (will use default template logo)</span>
                    )}
                  </div>
                  <div className="or-divider-text">OR paste external URL:</div>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..." 
                    value={cafeLogoUrl} 
                    onChange={(e) => setCafeLogoUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Cafe Accent Theme Color</label>
                  <div className="color-presets-wrapper">
                    <div className="color-presets">
                      {[
                        { name: 'Cyan', value: '#00f2fe' },
                        { name: 'Violet', value: '#7c3aed' },
                        { name: 'Emerald', value: '#10b981' },
                        { name: 'Ruby', value: '#ef4444' },
                        { name: 'Gold', value: '#f59e0b' }
                      ].map(color => (
                        <button
                          key={color.value}
                          type="button"
                          className={`color-preset-btn ${cafeThemeColor === color.value ? 'active' : ''}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setCafeThemeColor(color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <div className="custom-color-row">
                      <span className="color-label">Or Custom:</span>
                      <input 
                        type="color" 
                        value={cafeThemeColor}
                        onChange={(e) => setCafeThemeColor(e.target.value)}
                        className="custom-color-picker"
                      />
                      <span className="color-value-text">{cafeThemeColor}</span>
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : '✨ Create Cafe'}
                </button>
              </form>
            </div>

            <div className="list-card glass-card">
              <h2>Cafes Directory</h2>
              {cafes.length === 0 ? (
                <div className="empty-state">
                  <p>No cafes found. Create your first cafe to start!</p>
                </div>
              ) : (
                <div className="cafe-grid">
                  {displayedCafes.map(cafe => (
                    <div 
                      key={cafe.id} 
                      className={`cafe-card ${selectedCafe?.id === cafe.id ? 'selected' : ''}`}
                    >
                      <img 
                        className="cafe-logo" 
                        src={cafe.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=60'} 
                        alt={cafe.name} 
                      />
                      <div className="cafe-details">
                        <h3>{cafe.name}</h3>
                        {cafe.location && <p className="cafe-loc">📍 {cafe.location}</p>}
                        <span className="cafe-tables-lbl">🗂️ Tables: {cafe.table_count || 10}</span>
                      </div>
                      <div className="cafe-actions">
                        <button 
                          className="btn-select"
                          onClick={() => setSelectedCafe(cafe)}
                        >
                          {selectedCafe?.id === cafe.id ? 'Active' : 'Manage'}
                        </button>
                        <a 
                          href={`/table/4?cafe=${cafe.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-select link-customer-view"
                          style={{ textDecoration: 'none', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          📱 Menu
                        </a>
                        {deleteCafeConfirmId === cafe.id ? (
                          <div className="inline-confirm-row">
                            <button 
                              className="btn-confirm-yes"
                              onClick={() => handleDeleteCafe(cafe.id)}
                              title="Confirm deleting this cafe"
                            >
                              🗑️ Confirm?
                            </button>
                            <button 
                              className="btn-confirm-no"
                              onClick={() => setDeleteCafeConfirmId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn-delete-icon"
                            onClick={() => handleDeleteCafe(cafe.id)}
                            title="Delete Cafe"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MENU TAB */}
        {activeTab === 'menu' && (
          !selectedCafe ? (
            <div className="alert-select-cafe glass-card">
              <p>⚠️ Please create or select a cafe from the Cafes tab to manage its menu.</p>
            </div>
          ) : (
            <div className="pane-layout">
              {/* Left Column: Settings and Creation Form */}
              <div className="pane-left-column">
                {/* Discount Configuration Card */}
                <div className="form-card glass-card" style={{ marginBottom: '20px' }}>
                  <h2>🎁 Global Cafe Discount Settings</h2>
                  <p className="admin-sub">Set an automatic discount when customers upload photos and meet a minimum item count.</p>
                  <form onSubmit={handleUpdateDiscount} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end', marginTop: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Minimum Items</label>
                      <input 
                        type="number" 
                        min="0"
                        value={discountMinItems} 
                        onChange={(e) => setDiscountMinItems(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Discount (%)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={discountPercentage} 
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ height: '48px', margin: 0 }}>
                      Save Settings
                    </button>
                  </form>
                </div>

                {/* Add Menu Item */}
                <div className="form-card glass-card">
                  <h2>Add Menu Item</h2>
                  <form onSubmit={handleCreateMenuItem}>
                    {/* Branch Cafe Selector */}
                    <div className="form-group menu-branch-selector-group">
                      <label className="menu-branch-label">Target Cafe Branch *</label>
                      <p className="menu-branch-hint">Choose which cafe this menu item belongs to.</p>
                      <div className="menu-branch-grid">
                        {displayedCafes.map(cafe => (
                          <button
                            key={cafe.id}
                            type="button"
                            className={`menu-branch-card ${
                              menuTargetCafe?.id === cafe.id ? 'active' : ''
                            }`}
                            onClick={() => {
                              setMenuTargetCafe(cafe);
                              setDiscountMinItems(cafe.discount_min_items || 0);
                              setDiscountPercentage(cafe.discount_percentage || 0);
                              loadMenuItems(cafe.id);
                            }}
                          >
                            <img
                              src={cafe.logo_url}
                              alt={cafe.name}
                              className="branch-card-logo"
                            />
                            <div className="branch-card-text">
                              <span className="branch-card-name">{cafe.name}</span>
                              {cafe.location && (
                                <span className="branch-card-location">📍 {cafe.location}</span>
                              )}
                            </div>
                            {menuTargetCafe?.id === cafe.id && (
                              <span className="branch-card-check">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Item Name *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Margherita Pizza" 
                        value={itemName} 
                        onChange={(e) => setItemName(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Category / Section</label>
                      <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                        <option value="Main">Main Dishes</option>
                        <option value="Starter">Starters / Appetizers</option>
                        <option value="Dessert">Dessert</option>
                        <option value="Drinks">Drinks / Beverages</option>
                      </select>
                    </div>

                    {/* Veg / Non-Veg Selection */}
                    <div className="form-group">
                      <label>Dietary Tag *</label>
                      <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: 'inherit' }}>
                          <input 
                            type="radio" 
                            name="isVeg" 
                            checked={itemIsVeg === true} 
                            onChange={() => setItemIsVeg(true)} 
                            style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                          />
                          🟢 Veg (Vegetarian)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: 'inherit' }}>
                          <input 
                            type="radio" 
                            name="isVeg" 
                            checked={itemIsVeg === false} 
                            onChange={() => setItemIsVeg(false)} 
                            style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                          />
                          🔴 Non-Veg (Non-Vegetarian)
                        </label>
                      </div>
                    </div>
                  <div className="form-group">
                    <div className="price-label-row">
                      <label>Base Price ({currency.symbol}) *</label>
                      <div className="currency-switcher" role="group" aria-label="Select currency">
                        {currencies.map(c => (
                          <button
                            key={c.code}
                            type="button"
                            className={`currency-btn ${currencyCode === c.code ? 'active' : ''}`}
                            onClick={() => setCurrencyCode(c.code)}
                            title={`Set prices in ${c.label}`}
                            aria-pressed={currencyCode === c.code}
                          >
                            <span className="currency-flag">{c.flag}</span>
                            <span className="currency-code">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={`e.g. ${currencyCode === 'USD' ? '12.99' : currencyCode === 'INR' ? '299' : '1299'}`}
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Portion Options (Multi-Tier Serving Sizes)</label>
                    <div className="portions-input-row">
                      <input 
                        type="text" 
                        placeholder="e.g. Serve 1, Serve 2, Large Bowl" 
                        value={portionInput} 
                        onChange={(e) => setPortionInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPortion(); } }}
                      />
                      <button type="button" className="btn-add-portion" onClick={handleAddPortion}>Add</button>
                    </div>
                    {portionsList.length > 0 && (
                      <div className="portions-chip-list">
                        {portionsList.map(portion => (
                          <span key={portion} className="portion-chip-item">
                            {portion}
                            <button type="button" className="remove-chip-btn" onClick={() => handleRemovePortion(portion)}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      placeholder="Item ingredients, notes, allergens..." 
                      value={itemDescription} 
                      onChange={(e) => setItemDescription(e.target.value)}
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label>Product Image File</label>
                    <div className="file-upload-wrapper">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleItemFileChange}
                        id="itemImageFile"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="itemImageFile" className="btn-select file-upload-btn">
                        📂 Choose Image File
                      </label>
                      {itemPreview ? (
                        <div className="logo-preview-container">
                          <img src={itemPreview} alt="Item preview" className="logo-preview-img" />
                          <button type="button" className="remove-preview-btn" onClick={handleRemoveItemPreview}>×</button>
                        </div>
                      ) : (
                        <span className="file-name-label">No image selected (will use empty container)</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group checkbox-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px', marginBottom: '15px' }}>
                    <input 
                      type="checkbox" 
                      id="itemAvailable"
                      checked={itemAvailable} 
                      onChange={(e) => setItemAvailable(e.target.checked)} 
                      style={{ width: '18px', height: '18px', margin: 0, cursor: 'pointer' }}
                    />
                    <label htmlFor="itemAvailable" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem', color: 'inherit' }}>
                      Mark Available Immediately
                    </label>
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Adding...' : '✨ Add to Cafe Menu'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Catalog List */}
            <div className="pane-right-column">
              <div className="list-card glass-card">
                <h2>
                  {menuTargetCafe?.name || selectedCafe.name} Digital Catalog ({menuItems.length} items)
                  {menuTargetCafe && menuTargetCafe.id !== selectedCafe.id && (
                    <span className="catalog-branch-tag">📂 Branch view</span>
                  )}
                </h2>
                {menuItems.length === 0 ? (
                  <div className="empty-state">
                    <p>No menu items registered. Build your cafe catalog!</p>
                  </div>
                ) : (
                  <div className="menu-list-grid">
                    {menuItems.map(item => (
                      <div key={item.id} className="menu-item-row">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="admin-menu-thumb" />
                        )}
                        <div className="menu-item-details">
                          <div className="menu-item-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={`veg-dot ${item.is_veg !== false ? 'veg' : 'non-veg'}`} style={{ flexShrink: 0 }} title={item.is_veg !== false ? 'Vegetarian' : 'Non-Vegetarian'}></span>
                              {item.name}
                            </h3>
                            <span className="menu-item-price">{formatPrice(item.price)}</span>
                          </div>
                          {item.description && <p className="menu-item-desc">{item.description}</p>}
                          <div className="item-portions-list">
                            {item.portion_options && item.portion_options.map(p => (
                              <span key={p} className="portion-badge-preview">{p}</span>
                            ))}
                          </div>
                          <span className={`category-tag tag-${item.category.toLowerCase()}`}>{item.category}</span>
                        </div>
                        <div className="menu-item-actions">
                          <select
                            className={`btn-availability select-availability ${item.availability_status || (item.is_available ? 'available' : 'out-of-stock')}`}
                            value={item.availability_status || (item.is_available ? 'available' : 'out-of-stock')}
                            onChange={(e) => handleAvailabilityChange(item, e.target.value)}
                          >
                            <option value="available">Available</option>
                            <option value="out-of-stock">Out of Stock</option>
                            <option value="time-taking">Time Taking</option>
                          </select>
                          {deleteItemConfirmId === item.id ? (
                            <div className="inline-confirm-row">
                              <button 
                                className="btn-confirm-yes"
                                onClick={() => handleDeleteMenuItem(item.id)}
                                title="Confirm deleting this item"
                              >
                                🗑️ Confirm?
                              </button>
                              <button 
                                className="btn-confirm-no"
                                onClick={() => setDeleteItemConfirmId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn-delete-icon"
                              onClick={() => handleDeleteMenuItem(item.id)}
                              title="Delete Item"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        )}

        {/* QR STICKERS TAB */}
        {activeTab === 'qr_stickers' && (
          !selectedCafe ? (
            <div className="alert-select-cafe glass-card">
              <p>⚠️ Please create or select a cafe from the Cafes tab to manage table stickers.</p>
            </div>
          ) : (
            <div className="qr-stickers-manager glass-card">
              <div className="stickers-header-row">
                <div>
                  <h2>🖨️ QR Code Stickers Generator</h2>
                  <p>Generate print-ready sticker sheets for physical tables at <strong>{selectedCafe.name}</strong>.</p>
                </div>
                <button className="btn-primary btn-print-sheet" onClick={() => window.print()}>
                  🖨️ Print Stickers Sheet
                </button>
              </div>

              <div className="stickers-config-card glass-card">
                <div className="form-group">
                  <label>Change Tables Count for this Cafe:</label>
                  <div className="inline-config-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={selectedCafe.table_count || 10} 
                      onChange={async (e) => {
                        const val = parseInt(e.target.value) || 1;
                        const updated = await updateCafe(selectedCafe.id, { table_count: val });
                        if (updated) {
                          setSelectedCafe(updated);
                          setCafes(prev => prev.map(c => c.id === selectedCafe.id ? updated : c));
                        }
                      }}
                      style={{ width: '80px', padding: '0.45rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 'bold' }}
                    />
                    <span className="info-tip" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dynamic QR links update automatically.</span>
                  </div>
                </div>
                
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Base URL for QR Codes (Important for testing/deployment):</label>
                  <input 
                    type="text" 
                    value={qrBaseUrl} 
                    onChange={(e) => setQrBaseUrl(e.target.value)} 
                    placeholder="e.g. https://my-saas.vercel.app or http://192.168.1.x:5173"
                    className="form-input"
                  />
                  <span className="info-tip" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>If you test on your iPhone, change this to your laptop's Network IP instead of localhost!</span>
                </div>
              </div>

              {/* Printable Stickers Sheet Grid */}
              <div className="stickers-print-grid">
                {Array.from({ length: selectedCafe.table_count || 10 }).map((_, idx) => {
                  const tableNum = idx + 1;
                  const targetUrl = `${qrBaseUrl}/table/${tableNum}?cafe=${selectedCafe.id}`;
                  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(targetUrl)}`;
                  
                  return (
                    <div key={tableNum} className="table-sticker-card print-card">
                      <div className="sticker-brand">
                        <img 
                          src={selectedCafe.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=60'} 
                          alt="Logo" 
                        />
                        <h4>{selectedCafe.name}</h4>
                      </div>
                      
                      <div className="sticker-qr-wrapper">
                        <a href={targetUrl} target="_blank" rel="noreferrer" title="Click to test Customer View">
                          <img src={qrCodeUrl} alt={`Table ${tableNum} QR Code`} className="sticker-qr-img" />
                        </a>
                      </div>

                      <div className="sticker-footer">
                        <span className="table-badge-label">TABLE</span>
                        <h2>{tableNum}</h2>
                        <span className="sticker-scan-instruction">Scan to order dishes & play retro games!</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          !selectedCafe ? (
            <div className="alert-select-cafe glass-card">
              <p>⚠️ Please create or select a cafe from the Cafes tab to simulate order actions.</p>
            </div>
          ) : (
            <div className="pane-layout">
              <div className="form-card glass-card">
                <h2>Simulate Table Order</h2>
                <form onSubmit={handleCreateTestOrder}>
                  <div className="form-group">
                    <label>Target Table Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 4" 
                      value={orderTable} 
                      onChange={(e) => setOrderTable(e.target.value)} 
                    />
                  </div>
                  {menuItems.length > 0 ? (
                    <div className="form-group">
                      <label>Select Items & Quantities</label>
                      <div className="simulator-items-list">
                        {menuItems.map(item => {
                          const selected = selectedItems.find(si => si.item.id === item.id);
                          return (
                            <div key={item.id} className="sim-item-row">
                              <span className={item.is_available ? '' : 'text-muted-strike'}>
                                {item.name} ({formatPrice(item.price)})
                                {!item.is_available && ' (Out of stock)'}
                              </span>
                              <input 
                                type="number" 
                                min="0" 
                                placeholder="0" 
                                value={selected ? selected.quantity : ''}
                                onChange={(e) => handleSelectItemChange(item, e.target.value)}
                                disabled={!item.is_available}
                              />
                            </div>
                          );
                        })}
                      </div>
                      {selectedItems.length > 0 && (
                        <div className="order-total-preview">
                          Total: <strong>{formatPrice(selectedItems.reduce((acc, si) => acc + (si.item.price * si.quantity), 0))}</strong>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Write Custom Items</label>
                      <textarea 
                        placeholder="e.g. 2x Cappuccinos" 
                        value={customOrderText} 
                        onChange={(e) => setCustomOrderText(e.target.value)}
                        rows="3"
                      ></textarea>
                    </div>
                  )}
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Submitting...' : '⚡ Submit Order'}
                  </button>
                </form>
              </div>

              <div className="list-card glass-card">
                <h2>System Order Log ({orders.length} orders)</h2>
                {orders.length === 0 ? (
                  <div className="empty-state">
                    <p>No orders yet. Place a test order on the left!</p>
                  </div>
                ) : (
                  <div className="orders-feed">
                    {orders.map(order => (
                      <div key={order.id} className={`order-card status-${order.status}`}>
                        <div className="order-card-header">
                          <div>
                            <h3>Table {order.table_number}</h3>
                            <span className="order-time">{new Date(order.created_at).toLocaleTimeString()}</span>
                          </div>
                          <span className={`status-badge badge-${order.status}`}>{order.status.toUpperCase()}</span>
                        </div>
                        <div className="order-card-body">
                          <p className="order-items">{order.items}</p>
                          <p className="order-total">Total: {formatPrice(order.total_price || 0)}</p>
                        </div>
                        <div className="order-card-actions">
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <button 
                              className="btn-status-progress"
                              onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                            >
                              👨‍🍳 Progress Status
                            </button>
                          )}
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            cancelOrderConfirmId === order.id ? (
                              <div className="inline-confirm-row inline-confirm-order">
                                <button 
                                  className="btn-confirm-yes btn-status-cancel"
                                  onClick={() => handleCancelOrder(order.id)}
                                >
                                  Confirm Cancel?
                                </button>
                                <button 
                                  className="btn-confirm-no"
                                  onClick={() => setCancelOrderConfirmId(null)}
                                >
                                  Keep
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="btn-status-cancel"
                                onClick={() => handleCancelOrder(order.id)}
                              >
                                Cancel
                              </button>
                            )
                          )}
                          {deleteOrderConfirmId === order.id ? (
                            <div className="inline-confirm-row inline-confirm-order">
                              <button 
                                className="btn-confirm-yes btn-status-delete"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                Confirm Delete?
                              </button>
                              <button 
                                className="btn-confirm-no"
                                onClick={() => setDeleteOrderConfirmId(null)}
                              >
                                Keep
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn-status-delete"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              Delete Log
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
