import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useCurrency } from '../context/CurrencyContext';
import { PrintBillModal } from './AdminPanel';

export default function WaiterDashboard() {
  const {
    loading,
    error,
    setError,
    fetchCafes,
    fetchOrders,
    updateOrderStatus,
    updateOrder,
    subscribeToOrders,
    fetchStaff,
    fetchMenuItems,
    updateMenuItem
  } = useSupabase();

  const { formatPrice, setCurrencyCode } = useCurrency();
  const [cafes, setCafes] = useState([]);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);
  const [isCafeLocked, setIsCafeLocked] = useState(false);

  // Raw Inventory states for Waiter view
  const [rawIngredients, setRawIngredients] = useState([]);

  useEffect(() => {
    const syncIngredients = () => {
      if (selectedCafe) {
        const saved = localStorage.getItem(`raw_ingredients_inventory_cafe_${selectedCafe.id}`);
        setRawIngredients(saved ? JSON.parse(saved) : []);
      } else {
        setRawIngredients([]);
      }
    };
    syncIngredients();
    window.addEventListener('storage', syncIngredients);
    const interval = setInterval(syncIngredients, 4000);
    return () => {
      window.removeEventListener('storage', syncIngredients);
      clearInterval(interval);
    };
  }, [selectedCafe]);

  // Sync currency with selected cafe changes
  useEffect(() => {
    if (selectedCafe?.currency) {
      setCurrencyCode(selectedCafe.currency);
    }
  }, [selectedCafe]);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [toast, setToast] = useState(null);

  // Waiter session & login states
  const [waiterSession, setWaiterSession] = useState(() => {
    const savedName = localStorage.getItem('waiter_session_name');
    const savedCafeId = localStorage.getItem('waiter_session_cafe_id');
    return savedName && savedCafeId ? { name: savedName, cafeId: parseInt(savedCafeId) } : null;
  });
  const [loginCafeId, setLoginCafeId] = useState('');
  const [loginStaffList, setLoginStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Text-to-Speech Voice Notification
  const speakNotification = (text) => {
    if (isAudioMuted || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Synth Chime sound alert using browser Web Audio API
  const playNewOrderChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      
      // Note 1 (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);
      
      // Note 2 (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.08, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn('AudioContext playback blocked or failed:', e);
    }
  };

  // Synth low alarm buzz sound for Table Assistance Call Help requests
  const playAssistanceBuzz = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now); // Low buzz
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn('AudioContext playback blocked or failed:', e);
    }
  };

  // Fetch initial cafes list and validate session cafe ID / handle locks
  useEffect(() => {
    const loadInitialData = async () => {
      const data = await fetchCafes();
      if (data && data.length > 0) {
        setCafes(data);
        
        // Handle URL parameter lock
        const params = new URLSearchParams(window.location.search);
        const cafeQueryId = params.get('cafe');
        if (cafeQueryId) {
          const matched = data.find(c => String(c.id) === String(cafeQueryId));
          if (matched) {
            setSelectedCafe(matched);
            setIsCafeLocked(true);
            setLoginCafeId(matched.id);
            return;
          }
        }

        const savedCafeId = localStorage.getItem('waiter_session_cafe_id');
        if (savedCafeId) {
          const matched = data.find(c => String(c.id) === String(savedCafeId));
          if (matched) {
            setSelectedCafe(matched);
          } else {
            // Stale session cafe ID not found in database! Clear session to force re-login
            console.warn("Saved waiter session cafe ID not found in active cafe list. Clearing stale session.");
            localStorage.removeItem('waiter_session_name');
            localStorage.removeItem('waiter_session_cafe_id');
            setWaiterSession(null);
            setSelectedCafe(null);
          }
        }
      } else {
        setSelectedCafe(null);
      }
    };
    loadInitialData();
  }, []);

  // Fetch staff list for login selection when branch changes
  useEffect(() => {
    if (loginCafeId) {
      const loadStaffForLogin = async () => {
        const staff = await fetchStaff(loginCafeId);
        if (staff) {
          // Filter to only show waiters, chefs, or managers
          setLoginStaffList(staff);
        }
      };
      loadStaffForLogin();
    } else {
      setLoginStaffList([]);
    }
  }, [loginCafeId]);

  const handleKeypadPress = (val) => {
    if (pinCode.length < 4) {
      setPinCode(prev => prev + val);
    }
  };

  const handleKeypadBackspace = () => {
    setPinCode(prev => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPinCode('');
  };

  const handleWaiterLogin = () => {
    setPinError('');
    if (!loginCafeId) {
      setPinError('Please select your Cafe Branch.');
      return;
    }
    if (!selectedStaffId) {
      setPinError('Please select your Staff Name.');
      return;
    }
    if (pinCode.length !== 4) {
      setPinError('PIN must be exactly 4 digits.');
      return;
    }

    const member = loginStaffList.find(s => String(s.id) === String(selectedStaffId));
    if (member) {
      if (member.pin === pinCode) {
        const session = { name: member.name, cafeId: parseInt(loginCafeId) };
        setWaiterSession(session);
        localStorage.setItem('waiter_session_name', member.name);
        localStorage.setItem('waiter_session_cafe_id', String(loginCafeId));
        
        const targetCafe = cafes.find(c => String(c.id) === String(loginCafeId));
        if (targetCafe) setSelectedCafe(targetCafe);

        setPinCode('');
        setSelectedStaffId('');
        setLoginCafeId('');
      } else {
        setPinError('❌ Incorrect PIN. Please try again.');
        setPinCode('');
      }
    } else {
      setPinError('Staff member not found.');
    }
  };

  const handleWaiterLogout = () => {
    setWaiterSession(null);
    localStorage.removeItem('waiter_session_name');
    localStorage.removeItem('waiter_session_cafe_id');
    if (!isCafeLocked) {
      setSelectedCafe(null);
    } else if (selectedCafe) {
      setLoginCafeId(selectedCafe.id);
    }
  };

  // Fetch orders and subscribe to realtime events when selected cafe changes
  useEffect(() => {
    if (selectedCafe) {
      loadOrders(selectedCafe.id);
      loadMenuItems(selectedCafe.id);

      const unsubscribe = subscribeToOrders(selectedCafe.id, (payload) => {
        console.log('Waiter Realtime Update:', payload);
        
        // Refresh menu items stock on any order update/insert
        loadMenuItems(selectedCafe.id);

        if (payload.eventType === 'INSERT') {
          setOrders(prev => {
            if (prev.some(order => String(order.id) === String(payload.new.id))) {
              return prev;
            }
            return [payload.new, ...prev];
          });
          if (payload.new.status === 'assistance_needed') {
            if (!isAudioMuted) {
              playAssistanceBuzz();
              speakNotification(`Table number ${payload.new.table_number || 'unknown'} requested assistance`);
            }
            showToast(`🛎️ Table ${payload.new.table_number || 'N/A'} requested assistance!`, 'error');
          } else {
            if (!isAudioMuted) {
              playNewOrderChime();
              speakNotification(`Table number ${payload.new.table_number || 'unknown'} placed order`);
            }
            showToast(`🔥 Table ${payload.new.table_number || 'N/A'} has placed a new order!`, 'success');
          }
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
      setOrders([]);
      setMenuItems([]);
    }
  }, [selectedCafe, isAudioMuted]);

  // Periodic chime alarm trigger for active assistance buzzers
  useEffect(() => {
    const activeBuzzerCount = orders.filter(o => o.status === 'assistance_needed').length;
    if (activeBuzzerCount > 0 && !isAudioMuted) {
      const buzzerTimer = setInterval(() => {
        playAssistanceBuzz();
      }, 4000);
      return () => clearInterval(buzzerTimer);
    }
  }, [orders, isAudioMuted]);

  const loadOrders = async (cafeId) => {
    const data = await fetchOrders(cafeId);
    if (data) setOrders(data);
  };

  const loadMenuItems = async (cafeId) => {
    const data = await fetchMenuItems(cafeId);
    if (data) setMenuItems(data);
  };

  const speakLowStockNotification = (itemName, remaining, unit) => {
    if (isAudioMuted || !window.speechSynthesis) return;
    const key = `low_stock_spoken_${itemName}_${remaining}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'true');
    speakNotification(`Warning: ${itemName} is running low. Only ${remaining} ${unit || 'items'} left.`);
  };

  useEffect(() => {
    // Menu items stock alerts
    menuItems.forEach(item => {
      if (item.stock !== undefined && item.stock !== null && item.stock > 0 && item.stock <= (item.low_stock_threshold || 10)) {
        speakLowStockNotification(item.name, item.stock, item.stock_unit);
      }
    });

    // Raw ingredients stock alerts
    rawIngredients.forEach(item => {
      if (item.stock !== undefined && item.stock !== null && item.stock > 0 && item.stock <= (item.low_stock_threshold || 2)) {
        speakLowStockNotification(`Raw Material ${item.name}`, item.stock, item.unit);
      }
    });
  }, [menuItems, rawIngredients, isAudioMuted]);

  const handleUpdateStatus = async (orderId, currentStatus) => {
    let nextStatus = 'pending';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'completed';
    else if (currentStatus === 'delayed') nextStatus = 'preparing'; // resume from delay
    else if (currentStatus === 'unavailable') nextStatus = 'pending'; // reset shortage to verify

    const updated = await updateOrderStatus(orderId, nextStatus);
    if (updated) {
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    }
  };

  const handleMarkDelay = async (orderId) => {
    const updated = await updateOrderStatus(orderId, 'delayed');
    if (updated) {
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    }
  };

  const handleMarkUnavailable = async (orderId) => {
    const updated = await updateOrderStatus(orderId, 'unavailable');
    if (updated) {
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    }
  };

  const handleApproveBill = async (orderId) => {
    const updated = await updateOrder(orderId, { status: 'bill_approved' });
    if (updated) {
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    }
  };

  const handleApproveBillWithDetails = async (orderId, applyDiscount, discountPct, finalTotal) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let updatedItemsText = order.items;
    updatedItemsText = updatedItemsText
      .replace(/\n\[🎟️.*\]/g, '')
      .replace(/\n\[🎁.*\]/g, '')
      .replace(/\n\[❌.*\]/g, '');

    if (applyDiscount) {
      updatedItemsText += `\n[🎁 ${discountPct}% Discount Applied]`;
    } else {
      updatedItemsText += `\n[❌ Discount Revoked/Not Applied]`;
    }

    const updated = await updateOrder(orderId, {
      status: 'bill_approved',
      total_price: finalTotal,
      items: updatedItemsText
    });

    if (updated) {
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setSelectedOrderForBill(null);
      showToast('🎉 Bill approved successfully!', 'success');
    }
  };

  const handleDismissBuzzer = async (buzzerId) => {
    const updated = await updateOrder(buzzerId, { status: 'assistance_resolved' });
    if (updated) {
      setOrders(prev => prev.map(o => o.id === buzzerId ? updated : o));
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (confirmCancelId !== orderId) {
      setConfirmCancelId(orderId);
      // Auto-dismiss confirmation after 4 seconds if not acted on
      setTimeout(() => setConfirmCancelId(prev => prev === orderId ? null : prev), 4000);
      return;
    }
    setConfirmCancelId(null);
    const updated = await updateOrderStatus(orderId, 'cancelled');
    if (updated) {
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    }
  };

  const handleDownloadPhoto = async (photoObj) => {
    if (!photoObj || !photoObj.url) return;
    const { url, order, index } = photoObj;
    
    // Format creation time
    const orderTime = new Date(order.created_at || Date.now());
    let hours = orderTime.getHours();
    const minutes = String(orderTime.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours}:${minutes}${ampm}`;
    const cleanTime = timeStr.replace(':', '-');
    
    // Determine extension
    let ext = 'jpg';
    if (url.includes('image/png')) ext = 'png';
    else if (url.includes('image/gif')) ext = 'gif';
    else if (url.includes('image/webp')) ext = 'webp';
    else {
      const match = url.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
      if (match) ext = match[1];
    }
    
    const fileName = `tableno${order.table_number || 'N/A'}_image${index + 1}_${cleanTime}_approved.${ext}`;
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.warn("Could not download via fetch, falling back to direct anchor tag:", e);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    // Hide help requests/resolved logs from normal menu active columns to keep list tidy
    if (order.status === 'assistance_needed' || order.status === 'assistance_resolved') {
      return statusFilter === 'assistance';
    }

    if (statusFilter === 'active') {
      return order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'bill_approved';
    }
    return order.status === statusFilter;
  });

  const activeAssistance = orders.filter(o => o.status === 'assistance_needed');

  if (!waiterSession) {
    return (
      <div className="view-pane-container animated-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '20px' }}>
        <div className="form-card glass-card" style={{ maxWidth: '420px', width: '100%', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '20px', position: 'static' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 6px 0' }}>🛎️ Waiter Sign-In</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Select branch and name, then enter your 4-digit PIN.
            </p>
          </div>

          {pinError && (
            <div className="alert alert-error" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', textAlign: 'center' }}>
              {pinError}
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label>Cafe Branch</label>
            {isCafeLocked && selectedCafe ? (
              <input 
                type="text" 
                value={selectedCafe.name} 
                disabled 
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
              />
            ) : (
              <select value={loginCafeId} onChange={(e) => setLoginCafeId(e.target.value)}>
                <option value="">-- Select Cafe --</option>
                {cafes.filter(c => c.is_activated !== false).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Select Staff Member</label>
            <select 
              value={selectedStaffId} 
              onChange={(e) => setSelectedStaffId(e.target.value)}
              disabled={!loginCafeId}
            >
              <option value="">-- Select Name --</option>
              {loginStaffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>

          {/* PIN Input Display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Enter 4-Digit Passcode</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[0, 1, 2, 3].map(index => (
                <div 
                  key={index} 
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '8px',
                    border: '2px solid var(--cv-card-border, rgba(255,255,255,0.08))',
                    background: 'rgba(255, 255, 255, 0.03)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {pinCode[index] ? '•' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Numeric Keypad grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num} 
                type="button" 
                className="btn-select" 
                onClick={() => handleKeypadPress(String(num))}
                style={{ height: '55px', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold', border: '1px solid rgba(255, 255, 255, 0.08)' }}
              >
                {num}
              </button>
            ))}
            <button 
              type="button" 
              className="btn-select" 
              onClick={handleKeypadClear}
              style={{ height: '55px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#ef4444', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              Clear
            </button>
            <button 
              type="button" 
              className="btn-select" 
              onClick={() => handleKeypadPress('0')}
              style={{ height: '55px', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              0
            </button>
            <button 
              type="button" 
              className="btn-select" 
              onClick={handleKeypadBackspace}
              style={{ height: '55px', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              ⌫
            </button>
          </div>

          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleWaiterLogin}
            style={{ width: '100%', marginTop: '10px', height: '48px', fontSize: '1rem' }}
          >
            Confirm & Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-pane-container animated-fade-in">
      <div className="waiter-header-row">
        <div className="header-brand-waiter">
          <h2>👨‍🍳 Service Waiter Staff Dashboard</h2>
          <span className="live-pill">● Realtime Connection Active</span>
        </div>

        <div className="waiter-control-actions-row">
          {/* Audio Chime alert toggle */}
          <button 
            className={`btn-chime-toggle ${isAudioMuted ? 'muted' : 'active'}`}
            onClick={() => {
              setIsAudioMuted(!isAudioMuted);
              if (isAudioMuted) {
                setTimeout(() => playNewOrderChime(), 100);
              }
            }}
          >
            {isAudioMuted ? '🔇 Audio Chimes: Muted' : '🔊 Audio Chimes: Active'}
          </button>

          {/* Cafe Selector - hidden or replaced with staff info when logged in */}
          {waiterSession ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                👤 <strong>{waiterSession.name}</strong> @ {selectedCafe?.name}
              </span>
              <button 
                type="button" 
                className="btn-select" 
                onClick={handleWaiterLogout}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: '#ef4444', 
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px', 
                  padding: '6px 12px',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          ) : (
            <div className="cafe-selector">
              <label>Assign to Cafe:</label>
              <select 
                value={selectedCafe ? selectedCafe.id : ''} 
                onChange={(e) => {
                  const cafe = cafes.find(c => String(c.id) === String(e.target.value));
                  setSelectedCafe(cafe || null);
                }}
              >
                {cafes.filter(c => c.is_activated !== false).length === 0 ? (
                  <option value="">No Cafes Registered</option>
                ) : (
                  cafes.filter(c => c.is_activated !== false).map(cafe => (
                    <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {!selectedCafe ? (
        <div className="alert-select-cafe glass-card">
          <p>⚠️ No active cafe selected or available. Please register one in the Admin Panel.</p>
        </div>
      ) : (
        <div className="waiter-workspace">
          {/* Low Stock Warning Ticker Bar */}
          {(() => {
            const lowStockItems = menuItems.filter(item => item.stock !== undefined && item.stock !== null && item.stock <= (item.low_stock_threshold || 10));
            const lowStockRaw = rawIngredients.filter(item => item.stock !== undefined && item.stock !== null && item.stock <= (item.low_stock_threshold || 2));
            
            if (lowStockItems.length === 0 && lowStockRaw.length === 0) return null;
            return (
              <div className="low-stock-ticker-bar animated-fade-in">
                <div className="low-stock-ticker-header">
                  <span>⚠️</span>
                  <strong>Inventory Warning: The following items are running low!</strong>
                </div>
                <div className="low-stock-ticker-items">
                  {lowStockItems.map(item => (
                    <span key={`menu-${item.id}`} className="low-stock-ticker-item">
                      🍔 <strong>{item.name}</strong>: {item.stock === 0 ? 'Out of stock' : `${item.stock} ${item.stock_unit} left`}
                    </span>
                  ))}
                  {lowStockRaw.map(item => (
                    <span key={`raw-${item.id}`} className="low-stock-ticker-item" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      📦 <strong>[Raw] {item.name}</strong>: {item.stock === 0 ? 'Out of stock' : `${item.stock} ${item.unit} left`}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Status Tab Filters */}
          <div className="waiter-filters">
            <button 
              className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              🔥 Active ({orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'bill_approved' && o.status !== 'assistance_needed' && o.status !== 'assistance_resolved').length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'assistance' ? 'active' : ''}`}
              onClick={() => setStatusFilter('assistance')}
              style={{ position: 'relative' }}
            >
              🚨 Buzzers ({activeAssistance.length})
              {activeAssistance.length > 0 && <span className="buzzer-active-dot"></span>}
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              📥 Pending ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'preparing' ? 'active' : ''}`}
              onClick={() => setStatusFilter('preparing')}
            >
              👨‍🍳 Cooking ({orders.filter(o => o.status === 'preparing').length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'ready' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ready')}
            >
              🛎️ Ready ({orders.filter(o => o.status === 'ready').length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'bill_requested' ? 'active' : ''}`}
              onClick={() => setStatusFilter('bill_requested')}
            >
              💵 Bills ({orders.filter(o => o.status === 'bill_requested').length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'bill_approved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('bill_approved')}
            >
              ✅ Approved ({orders.filter(o => o.status === 'bill_approved').length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'delayed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('delayed')}
            >
              ⚠️ Delays ({orders.filter(o => o.status === 'delayed').length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'unavailable' ? 'active' : ''}`}
              onClick={() => setStatusFilter('unavailable')}
            >
              ❌ Out of Stock ({orders.filter(o => o.status === 'unavailable').length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              Served
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('cancelled')}
            >
              Cancelled
            </button>
          </div>

          {/* Orders Grid Display */}
          {filteredOrders.length === 0 ? (
            <div className="empty-state-waiter glass-card">
              <span className="empty-icon">🍽️</span>
              <h3>No orders match this status</h3>
              <p>New orders submitted by customers will appear here instantly in real-time.</p>
            </div>
          ) : (
            <div className="waiter-orders-grid">
              {filteredOrders.map(order => (
                <div key={order.id} className={`waiter-order-card card-status-${order.status} glass-card`}>
                  <div className="waiter-card-header">
                    <div className={`table-badge ${['pending', 'assistance_needed'].includes(order.status) ? 'flash-table-banner' : ''}`}>
                      <span>Table</span>
                      <h3>{order.table_number}</h3>
                    </div>
                    <div className="header-meta">
                      <span className="order-id">#Order {order.id.toString().slice(-4)}</span>
                      <span className="order-time-stamp">
                        ⏰ {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="waiter-card-body">
                    <div className="order-details-title">Order Items:</div>
                    <p className="order-items-list" style={{ whiteSpace: 'pre-wrap', color: order.status === 'assistance_needed' ? '#ef4444' : 'inherit', fontWeight: order.status === 'assistance_needed' ? 'bold' : 'normal' }}>
                      {order.items}
                    </p>
                    
                    {order.status === 'delayed' && (
                      <div className="status-warning-card warning-delayed">
                        ⚠️ <strong>Inventory Delay:</strong> Customer notified of preparation delay.
                      </div>
                    )}
                    {order.status === 'unavailable' && (
                      <div className="status-warning-card warning-unavailable">
                        ❌ <strong>Item Unavailable:</strong> Customer notified of item out-of-stock.
                      </div>
                    )}
                    {order.status === 'bill_requested' && (
                      <div className="status-warning-card warning-bill-requested">
                        💰 <strong>Bill Requested:</strong> Experience photos uploaded! Please verify and approve.
                      </div>
                    )}
                    {order.status === 'assistance_needed' && (
                      <div className="status-warning-card warning-assistance-buzzer" style={{ animation: 'pulseRedBorder 1.5s infinite alternate' }}>
                        🚨 <strong>Assistance Summoned:</strong> Customer needs a waiter at Table {order.table_number}!
                      </div>
                    )}

                    {/* Render UGC experience photos */}
                    {order.ugc_image && (
                      <div className="waiter-ugc-photos-section">
                        <span className="ugc-title">Customer Dining Photos:</span>
                        <div className="ugc-photos-grid">
                          {(() => {
                            try {
                              const photos = JSON.parse(order.ugc_image);
                              return photos.map((url, idx) => (
                                <img 
                                  key={idx} 
                                  src={url} 
                                  alt="Dining Experience" 
                                  className="waiter-ugc-thumb" 
                                  onClick={() => setFullscreenPhoto({ url, order, index: idx })}
                                />
                              ));
                            } catch (e) {
                              return <p className="ugc-error">Error loading photos format.</p>;
                            }
                          })()}
                        </div>
                      </div>
                    )}

                    <div className="order-total-waiter">
                      <span>Total Amount:</span>
                      <strong>{formatPrice(order.total_price || 0)}</strong>
                    </div>
                  </div>

                  <div className="waiter-card-footer">
                    {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'bill_approved' && order.status !== 'assistance_resolved' && (
                      <div className="waiter-action-layout">
                        {order.status === 'bill_requested' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <button 
                              className="action-btn-progress progress-bill-approve"
                              onClick={() => setSelectedOrderForBill(order)}
                              style={{ background: '#3b82f6', color: 'white', width: '100%', fontWeight: '700', padding: '12px' }}
                            >
                              🖨️ Review & Print Bill
                            </button>
                            <button 
                              className="action-btn-progress progress-bill-approve"
                              onClick={() => handleApproveBill(order.id)}
                              style={{ background: '#10b981', color: '#0b0f19', width: '100%', fontWeight: '700', padding: '12px' }}
                            >
                              ✅ Quick Approve Bill
                            </button>
                          </div>
                        ) : order.status === 'assistance_needed' ? (
                          <button 
                            className="action-btn-progress progress-assistance-resolve"
                            onClick={() => handleDismissBuzzer(order.id)}
                            style={{ background: '#ef4444', color: 'white', width: '100%', fontWeight: '700' }}
                          >
                            🏃 Resolve & Clear Help Alert
                          </button>
                        ) : (
                          <button 
                            className={`action-btn-progress progress-${order.status}`}
                            onClick={() => handleUpdateStatus(order.id, order.status)}
                          >
                            {order.status === 'pending' && '👨‍🍳 Begin Preparing'}
                            {order.status === 'preparing' && '🛎️ Call Ready'}
                            {order.status === 'ready' && '✅ Mark Served'}
                            {order.status === 'delayed' && '👨‍🍳 Resume Cooking'}
                            {order.status === 'unavailable' && '🔄 Reset Order'}
                          </button>
                        )}

                        {/* Inventory Exception Handlers */}
                        {['pending', 'preparing'].includes(order.status) && (
                          <div className="exception-actions-row">
                            <button 
                              className="action-btn-exception delay"
                              title="Notify customer of inventory delay"
                              onClick={() => handleMarkDelay(order.id)}
                            >
                              ⚠️ Inventory Delay
                            </button>
                            <button 
                              className="action-btn-exception shortage"
                              title="Notify customer of out-of-stock item"
                              onClick={() => handleMarkUnavailable(order.id)}
                            >
                              ❌ Item Unavailable
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'assistance_resolved' && (
                      confirmCancelId === order.id ? (
                        <div className="cancel-confirm-inline">
                          <span>Confirm cancel?</span>
                          <button className="action-btn-cancel confirm-yes" onClick={() => handleCancelOrder(order.id)}>✓ Yes, Cancel</button>
                          <button className="action-btn-cancel confirm-no" onClick={() => setConfirmCancelId(null)}>No</button>
                        </div>
                      ) : (
                        <button 
                          className="action-btn-cancel"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel
                        </button>
                      )
                    )}
                    {(order.status === 'completed' || order.status === 'cancelled' || order.status === 'bill_approved' || order.status === 'assistance_resolved') && (
                      <div className="archived-status-label" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                        <div>
                          {order.status === 'completed' && '✅ Completed & Served'}
                          {order.status === 'bill_approved' && '💰 Bill Approved & Voucher Released'}
                          {order.status === 'assistance_resolved' && '🤝 Help Summon Resolved'}
                          {order.status === 'cancelled' && '❌ Cancelled'}
                        </div>
                        {(order.status === 'bill_approved' || order.status === 'completed') && (
                          <button
                            type="button"
                            className="btn-select"
                            onClick={() => setSelectedOrderForBill(order)}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', borderRadius: '8px', color: 'white', fontWeight: 'bold' }}
                          >
                            🖨️ Reprint Bill Receipt
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Realtime Fullscreen Assistance Buzzer Alert Interceptor Overlay */}
      {activeAssistance.length > 0 && (
        <div className="assistance-buzzer-overlay glass-blur animated-fade-in">
          <div className="buzzer-alert-card glass-card pulsing-red-border animated-zoom-in">
            <div className="buzzer-icon">🚨</div>
            <h2>Table Assistance Summoned!</h2>
            <p>Customers need help at their physical tables. Please assist immediately.</p>
            <div className="buzzer-tables-list">
              {activeAssistance.map(buzzer => (
                <div key={buzzer.id} className="buzzer-table-item">
                  <span>🛎️ Table <strong>{buzzer.table_number}</strong> Requests Help!</span>
                  <button 
                    className="btn-dismiss-buzzer"
                    onClick={() => handleDismissBuzzer(buzzer.id)}
                  >
                    🏃 Assist & Clear
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal for Waiter Staff */}
      {fullscreenPhoto && (
        <div className="fullscreen-photo-overlay glass-blur animated-fade-in" onClick={() => setFullscreenPhoto(null)}>
          <div className="fullscreen-photo-modal" onClick={(e) => e.stopPropagation()}>
            <img src={fullscreenPhoto.url} alt="Dining Experience Fullscreen Preview" className="fullscreen-photo-img" />
            <div className="fullscreen-photo-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '15px' }}>
              <button 
                type="button"
                className="btn-primary" 
                onClick={() => handleDownloadPhoto(fullscreenPhoto)}
                style={{ background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer' }}
              >
                📥 Download Image
              </button>
              <button 
                type="button"
                className="btn-select" 
                onClick={() => setFullscreenPhoto(null)} 
                style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'white', background: 'transparent', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}
              >
                ✕ Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`customer-toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* Print Bill Modal overlay */}
      {selectedOrderForBill && (
        <PrintBillModal
          order={selectedOrderForBill}
          cafe={selectedCafe}
          menuItems={menuItems}
          formatPrice={formatPrice}
          onClose={() => setSelectedOrderForBill(null)}
          onApproveDiscount={handleApproveBillWithDetails}
          isWaiter={true}
        />
      )}
    </div>
  );
}
