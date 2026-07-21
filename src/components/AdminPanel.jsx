import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useCurrency } from '../context/CurrencyContext';
import { verifySuperAdmin, verifyPassword, formatQrDomain } from '../utils/security';

export default function AdminPanel({ mode = 'owner' }) {
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
    updateOrder,
    deleteOrder,
    subscribeToOrders,
    uploadImage,
    fetchStaff,
    createStaff,
    deleteStaff,
    validateActivationKey,
    fetchCafeByUsername,
    fetchCafeById,
    verifyRecoveryKey
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
  const [loginUsername, setLoginUsername] = useState('');
  const [isCafeLocked, setIsCafeLocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [activationKeyInput, setActivationKeyInput] = useState('');
  const [activatingCafe, setActivatingCafe] = useState(null);
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardName, setOnboardName] = useState('');
  const [onboardDescription, setOnboardDescription] = useState('');
  const [onboardLocation, setOnboardLocation] = useState('');
  const [onboardPhone, setOnboardPhone] = useState('');
  const [onboardLogoUrl, setOnboardLogoUrl] = useState('');
  const [onboardLogoFile, setOnboardLogoFile] = useState(null);
  const [onboardLogoPreview, setOnboardLogoPreview] = useState('');
  const [onboardUsername, setOnboardUsername] = useState('');
  const [onboardPassword, setOnboardPassword] = useState('');
  const [onboardShowPassword, setOnboardShowPassword] = useState(false);
  
  // Super Admin & Create Password Visibility States
  const [isSuperAdminSession, setIsSuperAdminSession] = useState(() => localStorage.getItem('is_super_admin_session') === 'true');
  const [superAdminUsername, setSuperAdminUsername] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [loginTab, _setLoginTab] = useState(mode === 'superadmin' ? 'super' : 'owner'); // 'owner' | 'super'
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Password Recovery States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordKey, setForgotPasswordKey] = useState('');
  const [forgotPasswordCafe, setForgotPasswordCafe] = useState(null);
  const [resetUsername, setResetUsername] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [inlineResetPasswordCafeId, setInlineResetPasswordCafeId] = useState(null);
  const [inlineNewPassword, setInlineNewPassword] = useState('');

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
  const [cafePhone, setCafePhone] = useState('');
  const [cafeFooterMsg, setCafeFooterMsg] = useState('');
  const [cafeFontFamily, setCafeFontFamily] = useState('Outfit');
  const [cafeLogoPlacement, setCafeLogoPlacement] = useState('left_header');
  // Auto-detect the live domain so QR codes always encode the correct public URL
  const [cafeQrDomain, setCafeQrDomain] = useState(() => typeof window !== 'undefined' ? window.location.origin : '');
  const [qrBaseUrl, setQrBaseUrl] = useState(() => typeof window !== 'undefined' ? window.location.origin : '');


  // Owner settings and branding states
  const [ownerName, setOwnerName] = useState('');
  const [ownerLocation, setOwnerLocation] = useState('');
  const [ownerDescription, setOwnerDescription] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerFooterMsg, setOwnerFooterMsg] = useState('');
  const [ownerLogoUrl, setOwnerLogoUrl] = useState('');
  const [ownerLogoFile, setOwnerLogoFile] = useState(null);
  const [ownerLogoPreview, setOwnerLogoPreview] = useState('');
  const [ownerThemeColor, setOwnerThemeColor] = useState('#00f2fe');
  const [ownerFontFamily, setOwnerFontFamily] = useState('Outfit');
  const [ownerLogoPlacement, setOwnerLogoPlacement] = useState('left_header');
  const [ownerCurrency, setOwnerCurrency] = useState('USD');
  const [ownerTableCount, setOwnerTableCount] = useState(10);
  const [ownerQrDomain, setOwnerQrDomain] = useState(() => typeof window !== 'undefined' ? window.location.origin : 'https://qr-menu-saas-dun.vercel.app');

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

  const handleOwnerFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOwnerLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOwnerLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveOwnerLogoPreview = () => {
    setOwnerLogoFile(null);
    setOwnerLogoPreview('');
    setOwnerLogoUrl('');
  };

  const handleOnboardFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOnboardLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOnboardLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveOnboardLogo = () => {
    setOnboardLogoFile(null);
    setOnboardLogoPreview('');
    setOnboardLogoUrl('');
  };

  const handleOnboardSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!onboardUsername.trim()) {
      setAdminAlertMsg('❌ Please enter an admin username.');
      return;
    }
    if (!onboardPassword.trim()) {
      setAdminAlertMsg('❌ Please enter a security password.');
      return;
    }
    if (onboardPassword.trim().length < 4) {
      setAdminAlertMsg('❌ Password must be at least 4 characters long.');
      return;
    }

    setAdminAlertMsg('');
    try {
      let finalLogoUrl = onboardLogoUrl;

      // 1. Upload custom logo file if selected
      if (onboardLogoFile) {
        const uploadedUrl = await uploadImage(onboardLogoFile, 'logos');
        if (uploadedUrl) {
          finalLogoUrl = uploadedUrl;
        }
      }

      // 2. Perform the update in Supabase / LocalStorage mock
      const payload = {
        name: onboardName.trim(),
        description: onboardDescription.trim(),
        location: onboardLocation.trim(),
        phone: onboardPhone.trim(),
        logo_url: finalLogoUrl,
        admin_username: onboardUsername.trim().toLowerCase(),
        admin_password: onboardPassword.trim(),
        is_activated: true
      };

      const updatedCafe = await updateCafe(activatingCafe.id, payload);

      if (updatedCafe) {
        // 3. Auto-login the owner
        setAdminSession(updatedCafe.id);
        setSelectedCafe(updatedCafe);
        localStorage.setItem('admin_session_cafe_id', String(updatedCafe.id));

        // 4. Reset activation states
        setActivatingCafe(null);
        setShowActivation(false);
        setActivationKeyInput('');
        setOnboardPassword('');
        setAdminAlertMsg('');

        // 5. Show success banner
        showAdminAlert('🎉 Cafe branch activated successfully! Welcome to your Portal Console.');
      } else {
        setAdminAlertMsg('❌ Failed to save setup details. Please try again.');
      }
    } catch (err) {
      setAdminAlertMsg(`❌ Error: ${err.message}`);
      console.error('Onboarding submission error:', err);
    }
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
  const [itemStock, setItemStock] = useState('');
  const [itemLowStockThreshold, setItemLowStockThreshold] = useState('');
  const [itemStockUnit, setItemStockUnit] = useState('pcs');
  const [recipeList, setRecipeList] = useState([]);
  const [selectedRecipeIngId, setSelectedRecipeIngId] = useState('');
  const [recipeQtyInput, setRecipeQtyInput] = useState('');

  // Target cafe branch for menu item — independent of global selectedCafe
  const [menuTargetCafe, setMenuTargetCafe] = useState(null);

  // Discount config states
  const [discountMinItems, setDiscountMinItems] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountPhone, setDiscountPhone] = useState('');
  const [discountFooterMsg, setDiscountFooterMsg] = useState('');

  // Billing Modal State
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);

  // Simulator Portion Selection State
  const [selectedPortionsSim, setSelectedPortionsSim] = useState({});

  const handleUpdateDiscount = async (e) => {
    e.preventDefault();
    if (!menuTargetCafe) return;
    const targetId = menuTargetCafe.id;
    const updated = await updateCafe(targetId, {
      discount_min_items: parseInt(discountMinItems) || 0,
      discount_percentage: parseInt(discountPercentage) || 0,
      phone: discountPhone,
      footer_message: discountFooterMsg
    });
    if (updated) {
      setCafes(prev => prev.map(c => c.id === targetId ? updated : c));
      setMenuTargetCafe(updated);
      if (selectedCafe?.id === targetId) setSelectedCafe(updated);
      showAdminAlert('Cafe settings and bill branding updated successfully!');
    }
  };

  // Confirm / alert state (iOS-safe, no browser dialogs)
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [deleteCafeConfirmId, setDeleteCafeConfirmId] = useState(null);
  const [deleteItemConfirmId, setDeleteItemConfirmId] = useState(null);
  const [cancelOrderConfirmId, setCancelOrderConfirmId] = useState(null);
  const [deleteOrderConfirmId, setDeleteOrderConfirmId] = useState(null);
  const [rawItemToDelete, setRawItemToDelete] = useState(null);
  const [adminAlertMsg, setAdminAlertMsg] = useState('');

  const showAdminAlert = (msg) => {
    setAdminAlertMsg(msg);
    setTimeout(() => setAdminAlertMsg(''), 3500);
  };

  const speakLowStockNotification = (itemName, remaining, unit) => {
    if (!window.speechSynthesis) return;
    const key = `low_stock_spoken_${itemName}_${remaining}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'true');
    
    const utterance = new SpeechSynthesisUtterance(`Warning: ${itemName} is running low. Only ${remaining} ${unit || 'items'} left.`);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    menuItems.forEach(item => {
      if (item.stock !== undefined && item.stock !== null && item.stock > 0 && item.stock <= (item.low_stock_threshold || 10)) {
        speakLowStockNotification(item.name, item.stock, item.stock_unit);
      }
    });
  }, [menuItems]);

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

  // 📦 Raw Inventory / Ingredients States & Logic
  const [rawIngredients, setRawIngredients] = useState([]);

  const [rawName, setRawName] = useState('');
  const [rawStock, setRawStock] = useState('');
  const [rawThreshold, setRawThreshold] = useState('');
  const [rawUnit, setRawUnit] = useState('KG');

  useEffect(() => {
    if (selectedCafe) {
      const saved = localStorage.getItem(`raw_ingredients_inventory_cafe_${selectedCafe.id}`);
      setRawIngredients(saved ? JSON.parse(saved) : [
        { id: 1, name: 'Maida / Flour', stock: 5, low_stock_threshold: 2, unit: 'KG' },
        { id: 2, name: 'Cigarette Boxes', stock: 50, low_stock_threshold: 10, unit: 'packs' },
        { id: 3, name: 'Cold Drink Bottles', stock: 50, low_stock_threshold: 5, unit: 'bottles' }
      ]);
    } else {
      setRawIngredients([]);
    }
  }, [selectedCafe]);

  useEffect(() => {
    if (selectedCafe && rawIngredients.length > 0) {
      localStorage.setItem(`raw_ingredients_inventory_cafe_${selectedCafe.id}`, JSON.stringify(rawIngredients));
    }
  }, [rawIngredients, selectedCafe]);

  const formatIngredientQty = (qty, unit) => {
    const num = parseFloat(qty);
    if (isNaN(num)) return `${qty} ${unit}`;
    if (num === 0) return `0 ${unit}`;
    
    if (unit === 'KG' && num < 1) {
      return `${(num * 1000).toFixed(0)} gm`;
    }
    if (unit === 'Litres' && num < 1) {
      return `${(num * 1000).toFixed(0)} ml`;
    }
    return `${num} ${unit}`;
  };

  const handleAddRawIngredient = (e) => {
    e.preventDefault();
    if (!rawName.trim()) return;
    const stockVal = parseFloat(rawStock) || 0;
    const newItem = {
      id: Date.now(),
      name: rawName,
      stock: stockVal,
      initial_stock: stockVal, // Track the capacity!
      low_stock_threshold: parseFloat(rawThreshold) || 1,
      unit: rawUnit
    };
    setRawIngredients(prev => [...prev, newItem]);
    setRawName('');
    setRawStock('');
    setRawThreshold('');
    setRawUnit('KG');
  };

  const handleUpdateRawStock = (id, newStockVal) => {
    const val = Math.max(0, parseFloat(newStockVal) || 0);
    setRawIngredients(prev => prev.map(item => {
      if (item.id === id) {
        const prevInitial = item.initial_stock !== undefined ? item.initial_stock : item.stock;
        // If refilled (updated stock is higher than previous initial_stock), increase the initial_stock capacity as well!
        const nextInitial = val > prevInitial ? val : prevInitial;
        return { ...item, stock: val, initial_stock: nextInitial };
      }
      return item;
    }));
  };

  const handleDeleteRawIngredient = (id) => {
    setRawIngredients(prev => prev.filter(item => item.id !== id));
  };

  // Super Admin SaaS-wide helpers
  const getSaasWideRevenueByCurrency = () => {
    const totals = {};
    orders.forEach(order => {
      if (order.status === 'completed' || order.status === 'bill_approved') {
        const orderCafe = cafes.find(c => String(c.id) === String(order.cafe_id));
        const currency = orderCafe?.currency || 'USD';
        totals[currency] = (totals[currency] || 0) + (Number(order.total_price) || 0);
      }
    });
    
    if (Object.keys(totals).length === 0) return '—';
    
    return Object.entries(totals).map(([currency, total]) => {
      if (currency === 'INR') return `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (currency === 'NPR') return `Rs. ${total.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      return `$${total.toFixed(2)}`;
    }).join('  |  ');
  };

  const getCafeNameForOrder = (orderCafeId) => {
    const matched = cafes.find(c => String(c.id) === String(orderCafeId));
    return matched ? matched.name : 'Unknown Cafe';
  };

  const getCafeCurrencyForOrder = (orderCafeId) => {
    const matched = cafes.find(c => String(c.id) === String(orderCafeId));
    return matched ? matched.currency || 'USD' : 'USD';
  };

  const formatPriceForCafe = (amount, cafeCurrency) => {
    const num = parseFloat(amount || 0);
    if (cafeCurrency === 'NPR') return `Rs. ${num.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (cafeCurrency === 'INR') return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${num.toFixed(2)}`;
  };

  // Fetch initial data (Cafes / Locked Cafe ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cafeQueryId = params.get('cafe');
    if (cafeQueryId) {
      const loadLockedCafe = async () => {
        const cafeData = await fetchCafeById(cafeQueryId);
        if (cafeData) {
          setSelectedCafe(cafeData);
          setIsCafeLocked(true);
        }
      };
      loadLockedCafe();
    }
    loadCafes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync login tab state when mode changes
  useEffect(() => {
    _setLoginTab(mode === 'superadmin' ? 'super' : 'owner');
  }, [mode]);


  // Fetch Cafe-specific data (Menu and Orders) and subscribe to realtime orders
  useEffect(() => {
    if (selectedCafe) {
      setMenuTargetCafe(selectedCafe);
      setDiscountMinItems(selectedCafe.discount_min_items || 0);
      setDiscountPercentage(selectedCafe.discount_percentage || 0);
      setDiscountPhone(selectedCafe.phone || '');
      setDiscountFooterMsg(selectedCafe.footer_message || '');
      
      setOwnerName(selectedCafe.name || '');
      setOwnerLocation(selectedCafe.location || '');
      setOwnerDescription(selectedCafe.description || '');
      setOwnerPhone(selectedCafe.phone || '');
      setOwnerFooterMsg(selectedCafe.footer_message || '');
      setOwnerLogoUrl(selectedCafe.logo_url || '');
      setOwnerLogoPreview(selectedCafe.logo_url || '');
      setOwnerLogoFile(null);
      setOwnerThemeColor(selectedCafe.theme_color || '#00f2fe');
      setOwnerFontFamily(selectedCafe.font_family || 'Outfit');
      setOwnerLogoPlacement(selectedCafe.logo_placement || 'left_header');
      setOwnerCurrency(selectedCafe.currency || 'USD');
      setOwnerTableCount(selectedCafe.table_count || 10);
      // Always prefer window.location.origin so QR codes encode the ACTUAL live domain,
      // ignoring stale DB values that may point to old/wrong deployments.
      const defaultDomain = window.location.origin;
      setOwnerQrDomain(defaultDomain);
      setQrBaseUrl(defaultDomain);
      
      loadMenuItems(selectedCafe.id);
      loadOrders(selectedCafe.id);

      // Subscribe to realtime orders for the selected cafe
      const unsubscribe = subscribeToOrders(selectedCafe.id, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => {
            if (prev.some(order => String(order.id) === String(payload.new.id))) {
              return prev;
            }
            return [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(order => order.id === payload.new.id ? payload.new : order));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(order => order.id !== payload.old.id));
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else if (isSuperAdminSession) {
      // In Super Admin session: Load ALL orders for platform-wide metrics & logs
      loadOrders(null);

      // Subscribe to ALL platform orders realtime events
      const unsubscribe = subscribeToOrders(null, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => {
            if (prev.some(order => String(order.id) === String(payload.new.id))) {
              return prev;
            }
            return [payload.new, ...prev];
          });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCafe, isSuperAdminSession]);

  // Data Loading Helpers
  const loadCafes = async () => {
    const savedSession = localStorage.getItem('admin_session_cafe_id');
    const isSuper = localStorage.getItem('is_super_admin_session') === 'true';
    if (savedSession || isSuper) {
      const data = await fetchCafes();
      if (data) {
        setCafes(data);
        if (savedSession) {
          const target = data.find(c => String(c.id) === String(savedSession));
          if (target) {
            setSelectedCafe(target);
            setAdminSession(target.id);
            return;
          } else {
            // Stale session! Clear it
            console.warn("Saved admin session cafe ID not found in active cafe list. Clearing stale session.");
            localStorage.removeItem('admin_session_cafe_id');
            setAdminSession(null);
            setSelectedCafe(null);
          }
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCafe, activeTab]);

  const loadStaff = async (cafeId) => {
    const data = await fetchStaff(cafeId);
    if (data) setStaffList(data);
  };

  const handleAdminLogin = async () => {
    setAdminAlertMsg('');

    if (loginTab === 'super') {
      const isSuperValid = await verifySuperAdmin(superAdminUsername, superAdminPassword);
      if (isSuperValid) {
        setIsSuperAdminSession(true);
        localStorage.setItem('is_super_admin_session', 'true');
        
        // Load all cafes for Super Admin console
        const allCafes = await fetchCafes();
        if (allCafes) {
          setCafes(allCafes);
        }

        setSelectedCafe(null); // Land on SaaS Overview dashboard first
        setActiveTab('saas_overview');
        setSuperAdminUsername('');
        setSuperAdminPassword('');
        setAdminAlertMsg('');
      } else {
        setAdminAlertMsg('❌ Incorrect Super Admin credentials.');
      }
      return;
    }

    let target = null;
    if (isCafeLocked && selectedCafe) {
      target = selectedCafe;
    } else {
      if (!loginUsername.trim()) {
        setAdminAlertMsg('Please enter your Admin Username.');
        return;
      }
      target = await fetchCafeByUsername(loginUsername.trim().toLowerCase());
    }

    if (target) {
      if (!target.is_activated) {
        setAdminAlertMsg('❌ This cafe branch has not been activated yet. Please activate it first.');
        return;
      }
      const correctPassword = target.admin_password || 'admin123';
      const isPasswordValid = await verifyPassword(loginPassword, correctPassword);
      if (isPasswordValid) {
        setAdminSession(target.id);
        setSelectedCafe(target);
        localStorage.setItem('admin_session_cafe_id', String(target.id));
        
        // Populate cafes list for list manager view on successful login
        const allCafes = await fetchCafes();
        if (allCafes) setCafes(allCafes);

        setLoginPassword('');
        setLoginUsername('');
        setAdminAlertMsg('');
      } else {
        setAdminAlertMsg('❌ Incorrect admin password. Please try again.');
      }
    } else {
      setAdminAlertMsg('❌ Admin username not found. Please verify and try again.');
    }
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    setIsSuperAdminSession(false);
    localStorage.removeItem('admin_session_cafe_id');
    localStorage.removeItem('is_super_admin_session');
    setSelectedCafe(null);
  };

  const handleVerifyRecoveryKey = async () => {
    const key = forgotPasswordKey.trim().toUpperCase();
    if (!key) {
      setAdminAlertMsg('❌ Please enter an activation key.');
      return;
    }
    setAdminAlertMsg('');
    const res = await verifyRecoveryKey(key);
    if (res.success) {
      setForgotPasswordCafe(res.cafe);
      setResetUsername(res.cafe.admin_username || '');
      setAdminAlertMsg('');
    } else {
      setAdminAlertMsg(res.message);
    }
  };

  const handleResetCredentials = async () => {
    if (!resetUsername.trim()) {
      setAdminAlertMsg('❌ Please enter a new admin username.');
      return;
    }
    if (!resetPassword.trim()) {
      setAdminAlertMsg('❌ Please enter a new password.');
      return;
    }
    if (resetPassword.trim().length < 4) {
      setAdminAlertMsg('❌ Password must be at least 4 characters long.');
      return;
    }

    setAdminAlertMsg('');
    try {
      const payload = {
        admin_username: resetUsername.trim().toLowerCase(),
        admin_password: resetPassword.trim()
      };
      
      const updated = await updateCafe(forgotPasswordCafe.id, payload);
      if (updated) {
        showAdminAlert('🎉 Credentials updated successfully! You can now log in.');
        
        // Reset states
        setShowForgotPassword(false);
        setForgotPasswordKey('');
        setForgotPasswordCafe(null);
        setResetUsername('');
        setResetPassword('');
        setAdminAlertMsg('');
      } else {
        setAdminAlertMsg('❌ Failed to update credentials. Please try again.');
      }
    } catch (err) {
      setAdminAlertMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleSuperAdminResetPassword = async (cafeId) => {
    if (!inlineNewPassword.trim() || inlineNewPassword.trim().length < 4) {
      showAdminAlert('❌ Password must be at least 4 characters long.');
      return;
    }
    try {
      const updated = await updateCafe(cafeId, { admin_password: inlineNewPassword.trim() });
      if (updated) {
        showAdminAlert(`🎉 Password for ${updated.name} updated successfully to: ${inlineNewPassword.trim()}`);
        setInlineResetPasswordCafeId(null);
        setInlineNewPassword('');
        
        // Refresh cafes list to keep views synced
        const allCafes = await fetchCafes();
        if (allCafes) setCafes(allCafes);
      } else {
        showAdminAlert('❌ Failed to reset password.');
      }
    } catch (err) {
      showAdminAlert(`❌ Error: ${err.message}`);
    }
  };

  const handleCurrencyChange = async (code) => {
    setCurrencyCode(code);
    if (selectedCafe) {
      const updated = await updateCafe(selectedCafe.id, { currency: code });
      if (updated) {
        setCafes(prev => prev.map(c => c.id === selectedCafe.id ? updated : c));
        setSelectedCafe(updated);
      }
    }
  };

  // Sync currency with selected cafe changes
  useEffect(() => {
    if (selectedCafe?.currency) {
      setCurrencyCode(selectedCafe.currency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCafe]);

  useEffect(() => {
    if (isSuperAdminSession && !selectedCafe) {
      setActiveTab('saas_overview');
    }
  }, [isSuperAdminSession, selectedCafe]);

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
      admin_password: cafeAdminPassword || 'admin123',
      phone: cafePhone,
      footer_message: cafeFooterMsg,
      font_family: cafeFontFamily,
      logo_placement: cafeLogoPlacement,
      qr_domain: formatQrDomain(cafeQrDomain)
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
      setCafePhone('');
      setCafeFooterMsg('');
      setCafeFontFamily('Outfit');
      setCafeLogoPlacement('left_header');
      setCafeQrDomain(typeof window !== 'undefined' ? window.location.origin : 'https://qr-menu-saas-dun.vercel.app');
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

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    if (!selectedCafe) return;

    let finalLogoUrl = ownerLogoUrl;
    if (ownerLogoFile) {
      finalLogoUrl = await uploadImage(ownerLogoFile, 'logos');
    }

    const updates = {
      name: ownerName,
      location: ownerLocation,
      description: ownerDescription,
      phone: ownerPhone,
      footer_message: ownerFooterMsg,
      logo_url: finalLogoUrl,
      theme_color: ownerThemeColor,
      font_family: ownerFontFamily,
      logo_placement: ownerLogoPlacement,
      currency: ownerCurrency,
      table_count: parseInt(ownerTableCount) || 10,
      qr_domain: formatQrDomain(ownerQrDomain)
    };

    const updated = await updateCafe(selectedCafe.id, updates);
    if (updated) {
      setSelectedCafe(updated);
      setCafes(prev => prev.map(c => c.id === updated.id ? updated : c));
      showAdminAlert('🎨 Branding and theme settings updated successfully!');
    } else {
      showAdminAlert('❌ Error updating branding settings.');
    }
  };

  // CRUD Handler - Menu Item
  const resetMenuItemForm = () => {
    setEditingMenuItem(null);
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
    setItemStock('');
    setItemLowStockThreshold('');
    setItemStockUnit('pcs');
    setRecipeList([]);
    setSelectedRecipeIngId('');
    setRecipeQtyInput('');
  };

  const handleStartEditMenuItem = (item) => {
    setEditingMenuItem(item);
    setItemName(item.name || '');
    setItemCategory(item.category || 'Main');
    setItemPrice(item.price !== undefined ? String(item.price) : '');
    setItemDescription(item.description || '');
    setItemAvailable(item.is_available !== false);
    setItemIsVeg(item.is_veg !== false);
    setPortionsList(item.portion_options || []);
    setItemPreview(item.image_url || '');
    setItemFile(null);
    setItemStock(item.stock !== undefined && item.stock !== null ? String(item.stock) : '');
    setItemLowStockThreshold(item.low_stock_threshold !== undefined && item.low_stock_threshold !== null ? String(item.low_stock_threshold) : '');
    setItemStockUnit(item.stock_unit || 'pcs');
    setRecipeList(item.recipe || []);
    setSelectedRecipeIngId('');
    setRecipeQtyInput('');

    // Smooth scroll the Add/Edit form card into view
    const formCard = document.querySelector('.form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // CRUD Handler - Menu Item (Create / Edit)
  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice.trim()) return;

    let finalImageUrl = itemPreview; // Keep existing image URL if not replacing
    if (itemFile) {
      finalImageUrl = await uploadImage(itemFile, 'menu_items');
    }

    const itemPayload = {
      cafe_id: (menuTargetCafe || selectedCafe).id,
      name: itemName,
      category: itemCategory,
      price: parseFloat(itemPrice),
      description: itemDescription,
      is_available: itemAvailable,
      is_veg: itemIsVeg,
      portion_options: portionsList,
      image_url: finalImageUrl,
      stock: itemStock.trim() !== '' ? parseInt(itemStock) : null,
      low_stock_threshold: itemLowStockThreshold.trim() !== '' ? parseInt(itemLowStockThreshold) : null,
      stock_unit: itemStockUnit || 'pcs',
      recipe: recipeList
    };

    if (editingMenuItem) {
      const updated = await updateMenuItem(editingMenuItem.id, itemPayload);
      if (updated) {
        setMenuItems(prev => prev.map(m => m.id === editingMenuItem.id ? updated : m));
        showAdminAlert('🎉 Menu item updated successfully!');
        resetMenuItemForm();
      } else {
        // Fallback for mock/local states
        setMenuItems(prev => prev.map(m => m.id === editingMenuItem.id ? { ...m, ...itemPayload, id: editingMenuItem.id } : m));
        showAdminAlert('🎉 Menu item updated!');
        resetMenuItemForm();
      }
    } else {
      const created = await createMenuItem(itemPayload);
      if (created) {
        setMenuItems(prev => [...prev, created]);
        showAdminAlert('🎉 Menu item created successfully!');
        resetMenuItemForm();
      }
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

  const deductIngredientsForOrderItem = (menuItem, quantity) => {
    if (!menuItem.recipe || !Array.isArray(menuItem.recipe) || !selectedCafe) return;
    
    const saved = localStorage.getItem(`raw_ingredients_inventory_cafe_${selectedCafe.id}`);
    if (!saved) return;
    
    let rawList = JSON.parse(saved);
    let updated = false;

    for (const step of menuItem.recipe) {
      rawList = rawList.map(ing => {
        if (ing.id === parseInt(step.ingredientId)) {
          updated = true;
          return { ...ing, stock: Math.max(0, ing.stock - (parseFloat(step.quantity) * quantity)) };
        }
        return ing;
      });
    }

    if (updated) {
      localStorage.setItem(`raw_ingredients_inventory_cafe_${selectedCafe.id}`, JSON.stringify(rawList));
      setRawIngredients(rawList); // Update state directly
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleCreateTestOrder = async (e) => {
    e.preventDefault();
    if (!selectedCafe) return;

    // Check stock for each selected item
    for (const si of selectedItems) {
      if (si.item.stock !== undefined && si.item.stock !== null && si.quantity > si.item.stock) {
        showAdminAlert(`❌ Stock shortage: Only ${si.item.stock} of ${si.item.name} remaining.`);
        return;
      }
    }

    let itemsStr = '';
    let total = 0;

    if (selectedItems.length > 0) {
      itemsStr = selectedItems.map(si => {
        const portion = selectedPortionsSim[si.item.id] || (si.item.portion_options && si.item.portion_options[0]) || '';
        const portionText = portion ? ` (${portion})` : '';
        return `${si.quantity}x ${si.item.name}${portionText}`;
      }).join(', ');
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
      // Deduct stock
      for (const si of selectedItems) {
        if (si.item.stock !== undefined && si.item.stock !== null) {
          const newStock = Math.max(0, si.item.stock - si.quantity);
          await updateMenuItem(si.item.id, { stock: newStock });
        }
        // Deduct raw ingredients mapping
        deductIngredientsForOrderItem(si.item, si.quantity);
      }

      // Update menuItems list locally
      setMenuItems(prev => prev.map(m => {
        const si = selectedItems.find(x => x.item.id === m.id);
        if (si && m.stock !== undefined && m.stock !== null) {
          return { ...m, stock: Math.max(0, m.stock - si.quantity) };
        }
        return m;
      }));

      setOrders(prev => [created, ...prev]);
      setOrderTable('');
      setSelectedItems([]);
      setSelectedPortionsSim({});
      setCustomOrderText('');
      setSelectedOrderForBill(created); // Open printable invoice immediately!
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
      showAdminAlert('Bill approved and closed successfully!');
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

  if (!adminSession && !isSuperAdminSession) {
    return (
      <div className="view-pane-container animated-fade-in no-print-workspace" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
        <div className="form-card glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem 2rem', position: 'static' }}>
          {showForgotPassword ? (
            forgotPasswordCafe ? (
              // Step 2: Choose new username and password
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>🔑 Reset Credentials</h2>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.4' }}>
                  Reset admin credentials for <strong>{forgotPasswordCafe.name}</strong>.
                </p>
                {adminAlertMsg && <div className="alert alert-error" style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>{adminAlertMsg}</div>}
                
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>New Admin Username *</label>
                  <input 
                    type="text" 
                    placeholder="Enter new username" 
                    value={resetUsername} 
                    onChange={(e) => setResetUsername(e.target.value)} 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label>New Password *</label>
                  <input 
                    type="password" 
                    placeholder="Enter new password" 
                    value={resetPassword} 
                    onChange={(e) => setResetPassword(e.target.value)} 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleResetCredentials}
                    style={{ width: '100%' }}
                  >
                    Save Credentials &amp; Log In
                  </button>
                  <button 
                    type="button" 
                    className="btn-select" 
                    onClick={() => {
                      setForgotPasswordCafe(null);
                      setAdminAlertMsg('');
                    }}
                    style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    ⬅️ Back
                  </button>
                </div>
              </>
            ) : (
              // Step 1: Input original Activation Key
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>🔑 Password Recovery</h2>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.4' }}>
                  Enter your cafe branch's original Activation Key to verify ownership and reset your credentials.
                </p>
                {adminAlertMsg && <div className="alert alert-error" style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>{adminAlertMsg}</div>}
                
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label>Activation Key</label>
                  <input 
                    type="text" 
                    placeholder="Enter original key (e.g. ACT-XXXX-XXXX)" 
                    value={forgotPasswordKey} 
                    onChange={(e) => setForgotPasswordKey(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleVerifyRecoveryKey}
                    style={{ width: '100%' }}
                  >
                    Verify Key &amp; Reset
                  </button>
                  <button 
                    type="button" 
                    className="btn-select" 
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordKey('');
                      setAdminAlertMsg('');
                    }}
                    style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )
          ) : activatingCafe ? (
            onboardStep === 1 ? (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>🚀 Cafe Setup Onboarding</h2>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Step 1 of 2: Configure Cafe Brand Details
                </div>
                {adminAlertMsg && <div className="alert alert-error" style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>{adminAlertMsg}</div>}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label>Cafe Name *</label>
                    <input 
                      type="text" 
                      placeholder="Enter cafe name"
                      value={onboardName} 
                      onChange={(e) => setOnboardName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Branch Location *</label>
                    <input 
                      type="text" 
                      placeholder="Enter location / branch" 
                      value={onboardLocation} 
                      onChange={(e) => setOnboardLocation(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="Enter phone number" 
                      value={onboardPhone} 
                      onChange={(e) => setOnboardPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Branding Description</label>
                    <textarea 
                      placeholder="Enter brief description" 
                      value={onboardDescription} 
                      onChange={(e) => setOnboardDescription(e.target.value)}
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label>Upload Logo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleOnboardFileChange}
                        style={{ display: 'none' }}
                        id="onboard-logo-uploader"
                      />
                      <label 
                        htmlFor="onboard-logo-uploader"
                        className="btn-select"
                        style={{ margin: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        📁 Choose Image
                      </label>
                      {onboardLogoPreview && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img 
                            src={onboardLogoPreview} 
                            alt="Logo preview" 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} 
                          />
                          <button 
                            type="button" 
                            onClick={handleRemoveOnboardLogo} 
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => {
                      if (!onboardName.trim()) {
                        setAdminAlertMsg('❌ Please enter a Cafe Name.');
                        return;
                      }
                      if (!onboardLocation.trim()) {
                        setAdminAlertMsg('❌ Please enter a Branch Location.');
                        return;
                      }
                      setAdminAlertMsg('');
                      setOnboardStep(2);
                    }}
                    style={{ width: '100%' }}
                  >
                    Next: Set Password ➔
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn-select" 
                    onClick={() => {
                      setActivatingCafe(null);
                      setActivationKeyInput('');
                      setShowActivation(true);
                      setAdminAlertMsg('');
                    }}
                    style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Cancel / Back
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>🔐 Set Security Password</h2>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Step 2 of 2: Define Branch Credentials
                </div>
                {adminAlertMsg && <div className="alert alert-error" style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>{adminAlertMsg}</div>}

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Admin Username *</label>
                  <input 
                    type="text" 
                    placeholder="Set username (e.g. mycafe)" 
                    value={onboardUsername}
                    onChange={(e) => setOnboardUsername(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label>Admin Password *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={onboardShowPassword ? "text" : "password"} 
                      placeholder="Enter secure password" 
                      value={onboardPassword}
                      onChange={(e) => setOnboardPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleOnboardSubmit(); }}
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onMouseDown={() => setOnboardShowPassword(true)}
                      onMouseUp={() => setOnboardShowPassword(false)}
                      onMouseLeave={() => setOnboardShowPassword(false)}
                      onTouchStart={() => setOnboardShowPassword(true)}
                      onTouchEnd={() => setOnboardShowPassword(false)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                        outline: 'none'
                      }}
                      title="Hold to show password"
                    >
                      {onboardShowPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleOnboardSubmit}
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    {loading ? 'Activating...' : 'Activate Cafe & Log In ✅'}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn-select" 
                    onClick={() => {
                      setOnboardStep(1);
                      setAdminAlertMsg('');
                    }}
                    style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    ⬅️ Back to Details
                  </button>
                </div>
              </>
            )
          ) : showActivation ? (
            <>
              <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>🔑 Branch Activation</h2>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.4' }}>
                Enter the activation key provided by the SaaS Super Admin to set up and register your cafe branch.
              </p>
              {adminAlertMsg && <div className="alert alert-error" style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>{adminAlertMsg}</div>}
              
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Activation Key</label>
                <input 
                  type="text" 
                  placeholder="Enter key (e.g. ACT-XXXX-XXXX)" 
                  value={activationKeyInput} 
                  onChange={(e) => setActivationKeyInput(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={async () => {
                    const key = activationKeyInput.trim();
                    if (!key) {
                      setAdminAlertMsg('❌ Please enter an activation key.');
                      return;
                    }
                    setAdminAlertMsg('');
                    const res = await validateActivationKey(key);
                    if (res.success) {
                      setActivatingCafe(res.cafe);
                      setOnboardStep(1);
                      setOnboardName(res.cafe.name || '');
                      setOnboardDescription(res.cafe.description || '');
                      setOnboardLocation(res.cafe.location || '');
                      setOnboardPhone(res.cafe.phone || '');
                      setOnboardLogoUrl(res.cafe.logo_url || '');
                      setOnboardLogoFile(null);
                      setOnboardLogoPreview(res.cafe.logo_url || '');
                      setAdminAlertMsg('');
                    } else {
                      setAdminAlertMsg(res.message);
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  Verify Activation Key
                </button>
                
                <button 
                  type="button" 
                  className="btn-select" 
                  onClick={() => {
                    setShowActivation(false);
                    setActivationKeyInput('');
                    setAdminAlertMsg('');
                  }}
                  style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Tab Selector — only shown when NEITHER mode forces a single view */}
              {!isCafeLocked && mode === 'owner' && (
                // /admin route: show ONLY the Cafe Owner tab (no Super Admin tab exposed)
                <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--accent-purple)'
                  }}>
                    <span>🏢</span>
                    <span>Cafe Owner Access</span>
                  </div>
                </div>
              )}
              {!isCafeLocked && mode === 'superadmin' && (
                // /superadmin route: show ONLY the Super Admin label (no Cafe Owner tab)
                <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(0,242,254,0.15)', paddingBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)'
                  }}>
                    <span>🛡️</span>
                    <span>SaaS Super Admin Console</span>
                  </div>
                </div>
              )}

              {loginTab === 'super' && !isCafeLocked ? (
                <>
                  <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>🛡️ SaaS Super Admin</h2>
                  <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.4' }}>
                    Enter master username and password to provision branches, copy keys, and manage global settings.
                  </p>
                  {adminAlertMsg && <div className="alert alert-error" style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>{adminAlertMsg}</div>}
                  
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label>Super Admin Username</label>
                    <input 
                      type="text" 
                      placeholder="Enter master username" 
                      value={superAdminUsername} 
                      onChange={(e) => setSuperAdminUsername(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label>Super Admin Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter master password" 
                      value={superAdminPassword} 
                      onChange={(e) => setSuperAdminPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>🔐 Cafe Owner Access</h2>
                  <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.4' }}>
                    {isCafeLocked && selectedCafe
                      ? `Enter the admin password for ${selectedCafe.name} to manage catalog and orders.`
                      : 'Enter your Admin Username and Password to manage catalog and orders.'}
                  </p>
                  {adminAlertMsg && <div className="alert alert-error" style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>{adminAlertMsg}</div>}
                  
                  {isCafeLocked && selectedCafe ? (
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label>Cafe Branch</label>
                      <input 
                        type="text" 
                        value={selectedCafe.name} 
                        disabled 
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                      />
                    </div>
                  ) : (
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label>Admin Username</label>
                      <input 
                        type="text" 
                        placeholder="Enter admin username" 
                        value={loginUsername} 
                        onChange={(e) => setLoginUsername(e.target.value)} 
                      />
                    </div>
                  )}
                  
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label>Admin Password</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter admin password" 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
                        style={{ paddingRight: '45px' }}
                      />
                      <button
                        type="button"
                        onMouseDown={() => setShowPassword(true)}
                        onMouseUp={() => setShowPassword(false)}
                        onMouseLeave={() => setShowPassword(false)}
                        onTouchStart={() => setShowPassword(true)}
                        onTouchEnd={() => setShowPassword(false)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          userSelect: 'none',
                          outline: 'none'
                        }}
                        title="Hold to show password"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '0.85rem' }}>
                <span/>
                {loginTab === 'owner' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setAdminAlertMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleAdminLogin}
                style={{ width: '100%', marginBottom: '16px' }}
              >
                {mode === 'superadmin' ? '🛡️ Enter Super Admin Console' : 'Access Panel'}
              </button>

              {/* Activate branch link — only relevant for cafe owners, not super admin */}
              {mode === 'owner' && (
                <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActivation(true);
                      setAdminAlertMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-cyan)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      textDecoration: 'underline'
                    }}
                  >
                    🔑 Activate Cafe Branch
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="view-pane-container animated-fade-in no-print-workspace">
      {/* SaaS Admin Header */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="admin-page-title-block">
          <div className="admin-title-eyebrow">
            {isSuperAdminSession 
              ? (selectedCafe ? "QR MENU SAAS — SUPER ADMIN (IMPERSONATING)" : "QR MENU SAAS — SUPER ADMIN PORTAL") 
              : "QR MENU SAAS — OWNER PORTAL"}
          </div>
          <h1 className="admin-page-h1">
            {isSuperAdminSession 
              ? (selectedCafe ? `Workspace: ${selectedCafe.name}` : "Super Admin Console") 
              : "Portal Console"}
          </h1>
          <p className="admin-sub" style={{ margin: 0 }}>
            {isSuperAdminSession 
              ? (selectedCafe 
                  ? "Configuring menu items, waiter pins, live orders, and raw inventory audits." 
                  : "Provision new branches, register activation keys, inspect audits, and reset credentials.") 
              : "Manage cafes, generate QR stickers, configure menus & simulate live table events."}
          </p>
        </div>

        {(adminSession || isSuperAdminSession) && (
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
            {isSuperAdminSession ? '🛡️ Log Out SaaS' : '🚪 Log Out Cafe'}
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

      {/* Super Admin Impersonation Banner */}
      {isSuperAdminSession && selectedCafe && (
        <div className="impersonation-banner" style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          color: '#f59e0b',
          fontSize: '0.9rem',
          fontWeight: 500,
          marginTop: '10px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🚨</span>
            <span>
              <strong>Active Workspace Mode:</strong> Impersonating <strong>{selectedCafe.name}</strong>. You are currently managing this cafe branch's catalog, staff, and live orders.
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCafe(null);
              setActiveTab('saas_overview');
            }}
            style={{
              background: '#f59e0b',
              color: '#111',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#d97706'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f59e0b'}
          >
            Exit Workspace
          </button>
        </div>
      )}

      {/* Admin Toast Alert Banner */}
      {adminAlertMsg && (
        <div className="admin-alert-banner animated-slide-down">
          <span>⚠️ {adminAlertMsg}</span>
          <button className="admin-alert-close" onClick={() => setAdminAlertMsg('')}>×</button>
        </div>
      )}
      {error && (
        <div className="admin-alert-banner animated-slide-down" style={{ background: 'rgba(239, 68, 68, 0.95)' }}>
          <span>❌ Database Error: {error}</span>
          <button className="admin-alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Global Stat Row */}
      <section className="stats-row">
        {isSuperAdminSession && !selectedCafe ? (
          <>
            <div className="stat-card glass-card">
              <div className="stat-icon icon-cafe">🏢</div>
              <div className="stat-info">
                <h3>Total Cafes</h3>
                <p className="stat-number">{cafes.length}</p>
              </div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon icon-menu" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>✅</div>
              <div className="stat-info">
                <h3>Activated</h3>
                <p className="stat-number">{cafes.filter(c => c.is_activated).length}</p>
              </div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon icon-orders" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>⏳</div>
              <div className="stat-info">
                <h3>Pending Keys</h3>
                <p className="stat-number">{cafes.filter(c => !c.is_activated).length}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card glass-card">
              <div className="stat-icon icon-cafe">🗂️</div>
              <div className="stat-info">
                <h3>Total Tables</h3>
                <p className="stat-number">{selectedCafe?.table_count || 0}</p>
              </div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon icon-menu">🍔</div>
              <div className="stat-info">
                <h3>Menu Items</h3>
                <p className="stat-number">{menuItems.length}</p>
              </div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon icon-orders">⚡</div>
              <div className="stat-info">
                <h3>Live Orders</h3>
                <p className="stat-number">
                  {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'bill_approved').length}
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Configuration & Management Area */}
      <div className="tabs-container">
        <div className="tab-buttons">
          {isSuperAdminSession && !selectedCafe ? (
            <>
              <button 
                className={`tab-btn ${activeTab === 'saas_overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('saas_overview')}
              >
                🛡️ SaaS Overview
              </button>
              <button 
                className={`tab-btn ${activeTab === 'cafes' ? 'active' : ''}`}
                onClick={() => setActiveTab('cafes')}
              >
                🏠 Cafes Registry
              </button>
            </>
          ) : (
            <>
              <button 
                  className={`tab-btn ${activeTab === 'cafes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cafes')}
                >
                  {isSuperAdminSession ? '🏠 Cafe Settings' : '🏠 Cafe Branch'}
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
              <button
                className={`tab-btn ${activeTab === 'raw_inventory' ? 'active' : ''}`}
                onClick={() => setActiveTab('raw_inventory')}
              >
                📦 Raw Inventory
              </button>
            </>
          )}
        </div>
      </div>

      <div className="tab-content">
        {/* SAAS OVERVIEW TAB */}
        {activeTab === 'saas_overview' && isSuperAdminSession && (
          <div className="saas-overview-tab animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="stat-card glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '2.5rem', background: 'rgba(0, 242, 254, 0.1)', color: '#00f2fe', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏢</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Cafe Branches</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold' }}>{cafes.length}</p>
                </div>
              </div>

              <div className="stat-card glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '2.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Activated Branches</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold' }}>{cafes.filter(c => c.is_activated).length}</p>
                </div>
              </div>

              <div className="stat-card glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '2.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Keys</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold' }}>{cafes.filter(c => !c.is_activated).length}</p>
                </div>
              </div>

              <div className="stat-card glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '2.5rem', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Orders</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold' }}>{orders.length}</p>
                </div>
              </div>

              <div className="stat-card glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '2.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛎️</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Requests</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {orders.filter(o => o.status === 'assistance_needed' || o.status === 'bill_requested').length}
                  </p>
                </div>
              </div>

              <div className="stat-card glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '2.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💰</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform Revenue</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '1.05rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#10b981' }}>
                    {getSaasWideRevenueByCurrency()}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Key Table */}
            <div className="form-card glass-card" style={{ width: '100%', maxWidth: 'none' }}>
              <h2>🔑 Unused Activation Keys</h2>
              <p className="admin-sub" style={{ marginBottom: '16px' }}>Provide these keys to cafe owners to let them activate their branch and setup credentials.</p>
              
              {cafes.filter(c => !c.is_activated).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                  🎉 No pending activations! All cafes are fully set up.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Cafe Name</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Activation Key</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Created At</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)', textAlign: 'right' }}>Copy Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cafes.filter(c => !c.is_activated).map(cafe => (
                        <tr key={cafe.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{cafe.name}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <code style={{ background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace', color: '#00f2fe' }}>
                              {cafe.activation_key}
                            </code>
                          </td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                            {new Date(cafe.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cafe.activation_key);
                                showAdminAlert(`🔑 Key for ${cafe.name} copied!`);
                              }}
                              className="btn-select"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              📋 Copy Key
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SaaS Live Activity Feed */}
            <div className="form-card glass-card" style={{ width: '100%', maxWidth: 'none' }}>
              <h2>🔄 Recent Platform Orders</h2>
              <p className="admin-sub" style={{ marginBottom: '16px' }}>Real-time feed of the latest orders placed across all cafe branches on the platform.</p>

              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                  ⏳ No orders placed yet on the platform.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Cafe Branch</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Table</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Items</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Total Amount</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Status</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Time</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)', textAlign: 'right' }}>Workspace Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(order => {
                        const cafeName = getCafeNameForOrder(order.cafe_id);
                        const cafeCurrency = getCafeCurrencyForOrder(order.cafe_id);
                        const matchedCafe = cafes.find(c => String(c.id) === String(order.cafe_id));
                        return (
                          <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{cafeName}</td>
                            <td style={{ padding: '12px 8px' }}>Table {order.table_number || 'N/A'}</td>
                            <td style={{ padding: '12px 8px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {order.items || '—'}
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: '500' }}>
                              {formatPriceForCafe(order.total_price || 0, cafeCurrency)}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <span className={`status-badge badge-${order.status}`} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px' }}>
                                {order.status === 'completed' ? 'SERVED ✅' : order.status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              {matchedCafe ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCafe(matchedCafe);
                                    setActiveTab('orders'); // Jump directly to order view
                                  }}
                                  className="btn-select"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  Manage Workspace ➔
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Information Card */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>ℹ️ Super Admin Guide</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                As a SaaS Super Admin, you are responsible for provisioning new cafe branches. To set up a new cafe, go to the <strong>🏠 Cafes Registry</strong> tab, specify a name and default credentials, and click "Create Cafe". This generates a cryptographically secure activation key.
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Copy the activation key and send it to the cafe owner. The owner will enter the key on the login page and set up their custom administrator username and password. After onboarding, the owner will run their cafe branch independently.
              </p>
            </div>
          </div>
        )}

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
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 ? (
                              <tr><td colSpan="7" className="sales-empty-row">No orders found for this period.</td></tr>
                            ) : (
                              filtered.slice(0, 20).map(o => (
                                <tr key={o.id}>
                                  <td className="order-id-cell">#{String(o.id).slice(-4)}</td>
                                  <td>Table {o.table_number}</td>
                                  <td className="items-cell">{o.items}</td>
                                  <td className="total-cell">{formatPrice(o.total_price || 0)}</td>
                                  <td><span className={`status-pill status-${o.status}`}>{o.status}</span></td>
                                  <td className="date-cell">{new Date(o.created_at).toLocaleDateString()}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn-select"
                                      onClick={() => setSelectedOrderForBill(o)}
                                      style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0, background: '#3b82f6', color: 'white' }}
                                    >
                                      🖨️ Bill
                                    </button>
                                  </td>
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

        {/* RAW INVENTORY TAB */}
        {activeTab === 'raw_inventory' && (
          <div className="pane-layout">
            {/* Left side: Add Raw Ingredient Form */}
            <div className="form-card glass-card">
              <h2>📦 Add Raw Ingredient</h2>
              <p className="admin-sub">Add bulk ingredients or raw inventory items (like Flour, Cigarette cartons, or Beverage boxes) to track overall restaurant stock levels.</p>
              <form onSubmit={handleAddRawIngredient}>
                <div className="form-group">
                  <label>Ingredient / Raw Item Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Flour / Maida" 
                    value={rawName}
                    onChange={(e) => setRawName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Current Stock Quantity *</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="e.g. 5" 
                    value={rawStock}
                    onChange={(e) => setRawStock(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Low Stock Warning Threshold *</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="e.g. 2" 
                    value={rawThreshold}
                    onChange={(e) => setRawThreshold(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Unit *</label>
                  <select value={rawUnit} onChange={(e) => setRawUnit(e.target.value)}>
                    <option value="KG">Kilogram (KG)</option>
                    <option value="Litres">Litres (L)</option>
                    <option value="packs">Packs / Cartons</option>
                    <option value="bottles">Bottles</option>
                    <option value="bags">Bags / Sacks</option>
                    <option value="pcs">Pieces (Pcs)</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  📦 Add to Raw Inventory
                </button>
              </form>
            </div>

            {/* Right side: Raw Inventory List */}
            <div className="list-card glass-card">
              <h2>Inventory Status & Ingredient Control</h2>
              {rawIngredients.length === 0 ? (
                <div className="empty-state">
                  <p>No raw ingredients in inventory. Register some items on the left!</p>
                </div>
              ) : (
                <div className="menu-list-grid">
                  {rawIngredients.map(item => {
                    const initial = item.initial_stock !== undefined ? item.initial_stock : item.stock;
                    const used = Math.max(0, initial - item.stock);
                    const isLow = item.stock <= item.low_stock_threshold;
                    return (
                      <div key={item.id} className="menu-item-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-heading)' }}>📦 {item.name}</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Low Threshold Alert: <strong style={{ color: '#f59e0b' }}>{formatIngredientQty(item.low_stock_threshold, item.unit)}</strong>
                            </p>
                          </div>
                          <div>
                            {item.stock === 0 ? (
                              <span className="stock-badge danger">Out of Stock</span>
                            ) : isLow ? (
                              <span className="stock-badge warning" style={{ animation: 'pulseLowStock 1.5s infinite alternate' }}>
                                Low Stock: {formatIngredientQty(item.stock, item.unit)} / {formatIngredientQty(initial, item.unit)} ({formatIngredientQty(used, item.unit)} used)
                              </span>
                            ) : (
                              <span className="stock-badge normal">
                                {formatIngredientQty(item.stock, item.unit)} / {formatIngredientQty(initial, item.unit)} ({formatIngredientQty(used, item.unit)} used)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inventory adjustments */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Update Stock:</span>
                            <input 
                              type="number" 
                              step="any"
                              value={item.stock}
                              onChange={(e) => handleUpdateRawStock(item.id, e.target.value)}
                              style={{ width: '80px', padding: '4px 8px', margin: 0, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', fontWeight: 'bold' }}
                            />
                            <span style={{ fontSize: '0.85rem' }}>{item.unit}</span>
                          </div>
                          
                          <button 
                            type="button"
                            className="btn-confirm-yes"
                            onClick={() => setRawItemToDelete(item)}
                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px' }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CAFES TAB */}
        {activeTab === 'cafes' && (
          <div className="pane-layout">
            {isSuperAdminSession && !selectedCafe && (
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
                    placeholder="Brief description of the cafe" 
                    value={cafeDescription} 
                    onChange={(e) => setCafeDescription(e.target.value)} 
                    rows="2"
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +39 06 123456" 
                    value={cafePhone} 
                    onChange={(e) => setCafePhone(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Bill Footer Message</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Thank you for visiting!" 
                    value={cafeFooterMsg} 
                    onChange={(e) => setCafeFooterMsg(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Cafe Admin Password *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showCreatePassword ? "text" : "password"} 
                      placeholder="Set password for this cafe admin portal" 
                      value={cafeAdminPassword} 
                      onChange={(e) => setCafeAdminPassword(e.target.value)}
                      required 
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onMouseEnter={() => setShowCreatePassword(true)}
                      onMouseLeave={() => setShowCreatePassword(false)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                        outline: 'none'
                      }}
                      title="Hover to show password"
                    >
                      {showCreatePassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </button>
                  </div>
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
                <div className="form-group">
                  <label>Typography Font Family</label>
                  <select value={cafeFontFamily} onChange={(e) => setCafeFontFamily(e.target.value)}>
                    <option value="Outfit">Outfit (Clean Sans-Serif)</option>
                    <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Modern Monospace)</option>
                    <option value="Quicksand">Quicksand (Friendly Rounded)</option>
                    <option value="Comfortaa">Comfortaa (Playful Cursive)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Brand Logo Placement</label>
                  <select value={cafeLogoPlacement} onChange={(e) => setCafeLogoPlacement(e.target.value)}>
                    <option value="left_header">Left Header (Standard inline logo)</option>
                    <option value="center_header">Center Header (Centered layout)</option>
                    <option value="top_banner">Top Banner (Landscape cover photo)</option>
                    <option value="hidden">Hidden (Text-only header)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Production QR Base Domain / Public URL Override</label>
                  <input 
                    type="url" 
                    placeholder="e.g. https://qr-menu-saas.vercel.app" 
                    value={cafeQrDomain} 
                    onChange={(e) => setCafeQrDomain(e.target.value)}
                  />
                  <span className="info-tip" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Base domain encoded into generated QR code stickers for mobile phone scanning.
                  </span>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : '✨ Create Cafe'}
                </button>
              </form>
            </div>
            )}

            {selectedCafe && (
              <div className="form-card glass-card">
                <h2>🎨 Branding & Theme Settings</h2>
                <p className="admin-sub">Customize accent colors, typography, brand logo placement, and branch information for <strong>{selectedCafe.name}</strong>.</p>
                
                <form onSubmit={handleSaveBranding}>
                  <div className="form-group">
                    <label>Cafe Name *</label>
                    <input 
                      type="text" 
                      value={ownerName} 
                      onChange={(e) => setOwnerName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Location / City</label>
                    <input 
                      type="text" 
                      value={ownerLocation} 
                      onChange={(e) => setOwnerLocation(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      value={ownerDescription} 
                      onChange={(e) => setOwnerDescription(e.target.value)} 
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input 
                      type="text" 
                      value={ownerPhone} 
                      onChange={(e) => setOwnerPhone(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Bill Footer Message</label>
                    <input 
                      type="text" 
                      value={ownerFooterMsg} 
                      onChange={(e) => setOwnerFooterMsg(e.target.value)} 
                      placeholder="e.g. Thanks for dining with us! Come back soon!"
                    />
                  </div>

                  <div className="form-group">
                    <label>Cafe Currency</label>
                    <select value={ownerCurrency} onChange={(e) => setOwnerCurrency(e.target.value)}>
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="NPR">NPR (Rs.)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Total Tables Count</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100"
                      value={ownerTableCount} 
                      onChange={(e) => setOwnerTableCount(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Cafe Logo Image</label>
                    <div className="file-upload-wrapper">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleOwnerFileChange}
                        id="ownerLogoFile"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="ownerLogoFile" className="btn-select file-upload-btn">
                        📂 Choose New Logo File
                      </label>
                      {ownerLogoPreview ? (
                        <div className="logo-preview-container">
                          <img src={ownerLogoPreview} alt="Logo preview" className="logo-preview-img" />
                          <button type="button" className="remove-preview-btn" onClick={handleRemoveOwnerLogoPreview}>×</button>
                        </div>
                      ) : (
                        <span className="file-name-label">No logo set (will use default template logo)</span>
                      )}
                    </div>
                    <div className="or-divider-text">OR paste external URL:</div>
                    <input 
                      type="url" 
                      placeholder="https://images.unsplash.com/..." 
                      value={ownerLogoUrl} 
                      onChange={(e) => setOwnerLogoUrl(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Accent Theme Color</label>
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
                            className={`color-preset-btn ${ownerThemeColor === color.value ? 'active' : ''}`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => setOwnerThemeColor(color.value)}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <div className="custom-color-row">
                        <span className="color-label">Or Custom:</span>
                        <input 
                          type="color" 
                          value={ownerThemeColor}
                          onChange={(e) => setOwnerThemeColor(e.target.value)}
                          className="custom-color-picker"
                        />
                        <span className="color-value-text">{ownerThemeColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Typography Font Family</label>
                    <select value={ownerFontFamily} onChange={(e) => setOwnerFontFamily(e.target.value)}>
                      <option value="Outfit">Outfit (Clean Sans-Serif)</option>
                      <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                      <option value="JetBrains Mono">JetBrains Mono (Modern Monospace)</option>
                      <option value="Quicksand">Quicksand (Friendly Rounded)</option>
                      <option value="Comfortaa">Comfortaa (Playful Cursive)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Brand Logo Placement</label>
                    <select value={ownerLogoPlacement} onChange={(e) => setOwnerLogoPlacement(e.target.value)}>
                      <option value="left_header">Left Header (Standard inline logo)</option>
                      <option value="center_header">Center Header (Centered layout)</option>
                      <option value="top_banner">Top Banner (Landscape cover photo)</option>
                      <option value="hidden">Hidden (Text-only header)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Production QR Base Domain / Public URL Override</label>
                    <input 
                      type="url" 
                      placeholder="e.g. https://qr-menu-saas.vercel.app" 
                      value={ownerQrDomain} 
                      onChange={(e) => setOwnerQrDomain(e.target.value)}
                    />
                    <span className="info-tip" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Domain encoded into printed & previewed QR stickers so mobile phones scan directly to your live site.
                    </span>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : '💾 Save Settings'}
                  </button>
                </form>
              </div>
            )}

            <div className="list-card glass-card">
              <h2>Cafes Directory</h2>
              {displayedCafes.length === 0 ? (
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

                        {/* Activation Status Info */}
                        <div style={{ marginTop: '10px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              background: cafe.is_activated ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: cafe.is_activated ? '#10b981' : '#f59e0b',
                              border: cafe.is_activated ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                            }}>
                              {cafe.is_activated ? 'Active ✅' : 'Pending ⏳'}
                            </span>
                          </div>
                          
                          {cafe.activation_key && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Key:</span>
                              <code style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.78rem', color: cafe.is_activated ? 'var(--text-muted)' : '#00f2fe' }}>
                                {cafe.is_activated ? 'USED' : cafe.activation_key}
                              </code>
                              {!cafe.is_activated && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(cafe.activation_key);
                                    showAdminAlert('🔑 Activation key copied to clipboard!');
                                  }}
                                  style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.72rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                  }}
                                >
                                  📋 Copy
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="cafe-actions">
                        <button 
                          className="btn-select"
                          onClick={() => {
                            setSelectedCafe(cafe);
                            if (isSuperAdminSession) {
                              setActiveTab('menu');
                            }
                          }}
                        >
                          {isSuperAdminSession 
                            ? (selectedCafe?.id === cafe.id ? 'Active Workspace' : 'Manage Workspace ➔')
                            : (selectedCafe?.id === cafe.id ? 'Active' : 'Manage')}
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
                        {isSuperAdminSession && (
                          inlineResetPasswordCafeId === cafe.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', marginTop: '8px', flexBasis: '100%' }}>
                              <input 
                                type="text"
                                placeholder="New Password"
                                value={inlineNewPassword}
                                onChange={(e) => setInlineNewPassword(e.target.value)}
                                style={{ flex: 1, padding: '4px 8px', fontSize: '0.78rem', height: '28px', minWidth: '80px' }}
                              />
                              <button 
                                type="button"
                                className="btn-primary"
                                onClick={() => handleSuperAdminResetPassword(cafe.id)}
                                style={{ padding: '0 8px', fontSize: '0.75rem', height: '28px', display: 'inline-flex', alignItems: 'center' }}
                              >
                                Save
                              </button>
                              <button 
                                type="button"
                                className="btn-select"
                                onClick={() => { setInlineResetPasswordCafeId(null); setInlineNewPassword(''); }}
                                style={{ padding: '0 8px', fontSize: '0.75rem', height: '28px', display: 'inline-flex', alignItems: 'center' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn-select"
                              onClick={() => {
                                setInlineResetPasswordCafeId(cafe.id);
                                setInlineNewPassword('');
                              }}
                              style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                            >
                              🔑 Reset Pass
                            </button>
                          )
                        )}

                        {isSuperAdminSession && (
                          <>  
                            {/* WhatsApp Credential Sharing */}
                            <button
                              type="button"
                              className="btn-select"
                              title="Share credentials via WhatsApp"
                              style={{ background: 'rgba(37, 211, 102, 0.12)', color: '#25d366', border: '1px solid rgba(37, 211, 102, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => {
                                const liveUrl = window.location.origin;
                                const msg = [
                                  `🏢 *QR Menu SaaS — Branch Credentials*`,
                                  `Branch: *${cafe.name}*`,
                                  cafe.location ? `📍 Location: ${cafe.location}` : '',
                                  ``,
                                  `🔑 Activation Key: \`${cafe.activation_key || 'N/A'}\``,
                                  `👤 Admin Username: \`${cafe.admin_username || cafe.name?.toLowerCase().replace(/\s+/g, '') || 'N/A'}\``,
                                  `🔒 Admin Password: \`${cafe.admin_password || '(contact SaaS admin)'}\``,
                                  ``,
                                  `🌐 Admin Portal: ${liveUrl}/admin`,
                                  `📱 Customer Menu (Table 1): ${liveUrl}/table/1?cafe=${cafe.id}`,
                                ].filter(Boolean).join('\n');
                                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                            >
                              📲 WhatsApp
                            </button>

                            {/* Copy All Credentials */}
                            <button
                              type="button"
                              className="btn-select"
                              title="Copy all credentials to clipboard"
                              style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => {
                                const liveUrl = window.location.origin;
                                const text = [
                                  `Branch: ${cafe.name}`,
                                  `Activation Key: ${cafe.activation_key || 'N/A'}`,
                                  `Admin Username: ${cafe.admin_username || cafe.name?.toLowerCase().replace(/\s+/g, '') || 'N/A'}`,
                                  `Admin Password: ${cafe.admin_password || '(contact SaaS admin)'}`,
                                  `Admin Portal: ${liveUrl}/admin`,
                                  `Customer Menu (Table 1): ${liveUrl}/table/1?cafe=${cafe.id}`,
                                ].join('\n');
                                navigator.clipboard.writeText(text);
                                showAdminAlert('📋 All credentials copied to clipboard!');
                              }}
                            >
                              📋 Copy Creds
                            </button>

                            {/* Delete cafe */}
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
                          </>
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
                  <h2>🎁 Global Cafe Settings & Bill Branding</h2>
                  <p className="admin-sub">Customize invoice details, phone numbers, and automatic discount rules for <strong>{menuTargetCafe?.name || selectedCafe?.name}</strong>.</p>
                  <form onSubmit={handleUpdateDiscount} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
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
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Contact Phone Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. +977-1-5551234"
                        value={discountPhone} 
                        onChange={(e) => setDiscountPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Bill Footer Message</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Thank You For Dining With Us!"
                        value={discountFooterMsg} 
                        onChange={(e) => setDiscountFooterMsg(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ height: '48px', gridColumn: 'span 2', marginTop: '8px' }}>
                      💾 Save Settings & Branding
                    </button>
                  </form>
                </div>

                {/* Add Menu Item */}
                <div className="form-card glass-card">
                  <h2>{editingMenuItem ? `✏️ Edit Menu Item: ${editingMenuItem.name}` : '✨ Add Menu Item'}</h2>
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
                              setDiscountPhone(cafe.phone || '');
                              setDiscountFooterMsg(cafe.footer_message || '');
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
                            onClick={() => handleCurrencyChange(c.code)}
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

                  {/* Stock Tracking Form Fields */}
                  <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Stock Qty (Optional)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 50" 
                        min="0"
                        value={itemStock} 
                        onChange={(e) => setItemStock(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Alert Threshold</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 5" 
                        min="0"
                        value={itemLowStockThreshold} 
                        onChange={(e) => setItemLowStockThreshold(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Stock Unit</label>
                      <select value={itemStockUnit} onChange={(e) => setItemStockUnit(e.target.value)}>
                        <option value="pcs">pcs (pieces)</option>
                        <option value="bottles">bottles</option>
                        <option value="KG">KG (kilograms)</option>
                        <option value="packs">packs</option>
                        <option value="servings">servings</option>
                      </select>
                    </div>
                  </div>

                  {/* Recipe Ingredient Mapping Form Panel */}
                  <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      🥗 Raw Ingredient Recipe Mapping (Optional)
                    </label>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      Link this menu item to raw ingredients. When ordered, it will automatically deduct from raw inventory.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Select Ingredient</label>
                        <select 
                          value={selectedRecipeIngId} 
                          onChange={(e) => setSelectedRecipeIngId(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        >
                          <option value="">-- Choose --</option>
                          {rawIngredients.map(ing => (
                            <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Qty Consumed</label>
                        <input 
                          type="number" 
                          step="any"
                          placeholder="e.g. 0.1" 
                          value={recipeQtyInput}
                          onChange={(e) => setRecipeQtyInput(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                      </div>
                      <button 
                        type="button" 
                        className="btn-select"
                        onClick={() => {
                          if (!selectedRecipeIngId || !recipeQtyInput.trim()) return;
                          const qty = parseFloat(recipeQtyInput);
                          if (isNaN(qty) || qty <= 0) return;
                          const ing = rawIngredients.find(r => r.id === parseInt(selectedRecipeIngId));
                          if (!ing) return;
                          
                          if (recipeList.some(r => r.ingredientId === ing.id)) {
                            showAdminAlert('Ingredient already linked to this item!');
                            return;
                          }
                          
                          setRecipeList(prev => [...prev, {
                            ingredientId: ing.id,
                            name: ing.name,
                            quantity: qty,
                            unit: ing.unit
                          }]);
                          setSelectedRecipeIngId('');
                          setRecipeQtyInput('');
                        }}
                        style={{ height: '36px', padding: '0 12px', fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        ＋ Link
                      </button>
                    </div>

                    {/* Mapped list display */}
                    {recipeList.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {recipeList.map(step => (
                          <span 
                            key={step.ingredientId} 
                            style={{ 
                              background: 'rgba(124, 58, 237, 0.15)', 
                              border: '1px solid rgba(124, 58, 237, 0.3)', 
                              color: '#c084fc', 
                              fontSize: '0.75rem', 
                              padding: '4px 8px', 
                              borderRadius: '20px', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px' 
                            }}
                          >
                            ⚙️ {step.name}: <strong>{step.quantity} {step.unit}</strong>
                            <button 
                              type="button" 
                              onClick={() => setRecipeList(prev => prev.filter(r => r.ingredientId !== step.ingredientId))}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#ef4444', 
                                cursor: 'pointer', 
                                fontSize: '0.85rem', 
                                padding: 0, 
                                display: 'inline-flex', 
                                alignItems: 'center',
                                marginLeft: '4px'
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
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
                  {editingMenuItem ? (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                      <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                        {loading ? 'Saving...' : '💾 Save Changes'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-select" 
                        onClick={resetMenuItemForm} 
                        style={{ border: '1px solid rgba(255, 255, 255, 0.1)', flex: 1, margin: 0, padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        ❌ Cancel Edit
                      </button>
                    </div>
                  ) : (
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                      {loading ? 'Adding...' : '✨ Add to Cafe Menu'}
                    </button>
                  )}
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
                          {/* Stock status indicator */}
                          <div style={{ marginTop: '5px', marginBottom: '5px' }}>
                            {item.stock !== undefined && item.stock !== null ? (
                              item.stock === 0 ? (
                                <span className="stock-badge danger">Out of Stock</span>
                              ) : item.stock <= (item.low_stock_threshold || 10) ? (
                                <span className="stock-badge warning">Low Stock: {item.stock} {item.stock_unit}</span>
                              ) : (
                                <span className="stock-badge normal">Stock: {item.stock} {item.stock_unit}</span>
                              )
                            ) : (
                              <span className="stock-badge normal" style={{ opacity: 0.6 }}>Stock: Unlimited</span>
                            )}
                          </div>
                          <div className="item-portions-list">
                            {item.portion_options && item.portion_options.map(p => (
                              <span key={p} className="portion-badge-preview">{p}</span>
                            ))}
                          </div>
                          {item.recipe && Array.isArray(item.recipe) && item.recipe.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                              {item.recipe.map(r => (
                                <span key={r.ingredientId} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: '#c084fc', padding: '2px 6px', borderRadius: '4px', border: '1px dashed rgba(124, 58, 237, 0.2)' }}>
                                  ⚙️ consumes {formatIngredientQty(r.quantity, r.unit)} of {r.name}
                                </span>
                              ))}
                            </div>
                          )}
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
                          <button 
                            type="button"
                            className="btn-select"
                            onClick={() => handleStartEditMenuItem(item)}
                            title="Edit Item Details"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', margin: 0, border: '1px solid rgba(255,255,255,0.08)' }}
                          >
                            ✏️ Edit
                          </button>
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
                <button
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', minWidth: '180px' }}
                  onClick={() => {
                    const targetDomain = formatQrDomain(qrBaseUrl);
                    const tableCount = selectedCafe.table_count || 10;
                    const logoUrl = selectedCafe.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=60';
                    const cafeName = selectedCafe.name || 'Cafe';

                    // Build sticker cards HTML with fully inline styles
                    const cards = Array.from({ length: tableCount }, (_, idx) => {
                      const tableNum = idx + 1;
                      const targetUrl = `${targetDomain}/table/${tableNum}?cafe=${selectedCafe.id}`;
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(targetUrl)}`;
                      return `
                        <div style="border:2px solid #222;border-radius:14px;padding:18px 14px;background:#fff;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;break-inside:avoid;page-break-inside:avoid;">
                          <img src="${logoUrl}" alt="logo" style="width:52px;height:52px;object-fit:contain;border-radius:8px;border:1px solid #ddd;" onerror="this.style.display='none'" />
                          <div style="font-size:13px;font-weight:700;color:#111;margin:2px 0;">${cafeName}</div>
                          <img src="${qrUrl}" alt="QR Table ${tableNum}" style="width:160px;height:160px;display:block;margin:4px auto;" />
                          <div style="font-size:10px;font-weight:800;letter-spacing:3px;color:#555;text-transform:uppercase;margin-top:4px;">TABLE</div>
                          <div style="font-size:36px;font-weight:900;color:#111;line-height:1;margin:0;">${tableNum}</div>
                          <div style="font-size:10px;color:#444;margin-top:2px;">Scan to order &amp; play retro games!</div>
                        </div>`;
                    }).join('');

                    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${cafeName} — QR Table Stickers</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; font-family: 'Segoe UI', Arial, sans-serif; padding: 16px; }
    h1 { font-size: 18px; color: #111; margin-bottom: 4px; }
    p  { font-size: 12px; color: #555; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    @media print {
      body { padding: 8px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <h1>🖨️ QR Sticker Sheet — ${cafeName}</h1>
  <p>Scan any QR code to go directly to the table's menu. Domain: ${targetDomain}</p>
  <div class="grid">${cards}</div>
  <script>
    // Auto-print once all images are loaded
    window.onload = function() {
      setTimeout(function() { window.print(); }, 800);
    };
  <\/script>
</body>
</html>`;

                    const win = window.open('', '_blank', 'width=900,height=700');
                    if (win) {
                      win.document.write(html);
                      win.document.close();
                    } else {
                      showAdminAlert('⚠️ Pop-up blocked! Please allow pop-ups for this site, then try again.');
                    }
                  }}
                >
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Base URL / Public Domain for QR Codes (Mobile Scanning):</label>
                    <button
                      type="button"
                      className="btn-select"
                      style={{ fontSize: '0.75rem', padding: '3px 10px', height: '28px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' }}
                      onClick={async () => {
                        const formatted = formatQrDomain(qrBaseUrl);
                        setQrBaseUrl(formatted);
                        setOwnerQrDomain(formatted);
                        const updated = await updateCafe(selectedCafe.id, { qr_domain: formatted });
                        if (updated) {
                          setSelectedCafe(updated);
                          setCafes(prev => prev.map(c => c.id === updated.id ? updated : c));
                          showAdminAlert('💾 Production QR Base Domain saved as cafe default!');
                        }
                      }}
                    >
                      💾 Save as Default Domain
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={qrBaseUrl} 
                    onChange={(e) => setQrBaseUrl(e.target.value)} 
                    placeholder="e.g. https://your-domain.vercel.app"
                    className="form-input"
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn-select" 
                      style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', border: '1px solid rgba(0, 242, 254, 0.3)' }}
                      onClick={() => setQrBaseUrl(window.location.origin)}
                    >
                      🌐 Use Current Live Domain ({window.location.origin})
                    </button>
                    <button 
                      type="button" 
                      className="btn-select" 
                      style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                      onClick={() => setQrBaseUrl('http://localhost:5173')}
                    >
                      💻 Local Dev Server (http://localhost:5173)
                    </button>
                  </div>
                  <span className="info-tip" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                    📱 Printed sticker QR codes will encode this domain. Mobile phones scan directly to your live production URL.
                  </span>
                </div>
              </div>

              {/* Live Preview of Sticker Cards */}
              <div className="stickers-print-grid">
                {Array.from({ length: selectedCafe.table_count || 10 }).map((_, idx) => {
                  const tableNum = idx + 1;
                  const targetDomain = formatQrDomain(qrBaseUrl);
                  const targetUrl = `${targetDomain}/table/${tableNum}?cafe=${selectedCafe.id}`;
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
                        <span className="sticker-scan-instruction">Scan to order dishes &amp; play retro games!</span>
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
                            <div key={item.id} className="sim-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className={item.is_available && item.stock !== 0 ? '' : 'text-muted-strike'}>
                                  {item.name} ({formatPrice(item.price)})
                                  {!item.is_available && ' (Out of stock)'}
                                  {item.is_available && item.stock === 0 && ' (Sold out)'}
                                </span>
                                {item.stock !== undefined && item.stock !== null && (
                                  <span style={{ fontSize: '0.75rem', color: item.stock <= (item.low_stock_threshold || 10) ? '#f59e0b' : '#9ca3af' }}>
                                    Remaining Stock: {item.stock} {item.stock_unit}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {item.portion_options && item.portion_options.length > 0 && (
                                  <select
                                    value={selectedPortionsSim[item.id] || item.portion_options[0]}
                                    onChange={(e) => setSelectedPortionsSim({
                                      ...selectedPortionsSim,
                                      [item.id]: e.target.value
                                    })}
                                    style={{ padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '6px', fontSize: '0.8rem' }}
                                    disabled={!item.is_available || item.stock === 0}
                                  >
                                    {item.portion_options.map(p => (
                                      <option key={p} value={p}>{p}</option>
                                    ))}
                                  </select>
                                )}
                                <input 
                                  type="number" 
                                  min="0" 
                                  placeholder="0" 
                                  value={selected ? selected.quantity : ''}
                                  onChange={(e) => handleSelectItemChange(item, e.target.value)}
                                  disabled={!item.is_available || item.stock === 0}
                                  style={{ width: '60px', padding: '4px 6px', margin: 0 }}
                                />
                              </div>
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
                          {order.status !== 'cancelled' && (
                            <button 
                              className="btn-status-progress"
                              onClick={() => setSelectedOrderForBill(order)}
                              style={{ background: '#3b82f6', color: 'white' }}
                            >
                              🖨️ Bill / Print
                            </button>
                          )}
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
      
      {/* Print Bill Modal overlay */}
      {selectedOrderForBill && (
        <PrintBillModal
          order={selectedOrderForBill}
          cafe={selectedCafe}
          menuItems={menuItems}
          formatPrice={formatPrice}
          onClose={() => setSelectedOrderForBill(null)}
          onApproveDiscount={handleApproveBillWithDetails}
        />
      )}

      {/* Delete Raw Ingredient Confirmation Modal Popup */}
      {rawItemToDelete && (
        <div className="bill-modal-overlay animated-fade-in no-print" onClick={() => setRawItemToDelete(null)}>
          <div className="bill-modal-card glass-card animated-zoom-in" onClick={(e) => e.stopPropagation()} style={{ background: '#111827', color: 'white', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '1.1rem', fontWeight: 'bold' }}>
                ⚠️ Confirm Deletion
              </h3>
              <button 
                type="button" 
                onClick={() => setRawItemToDelete(null)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#d1d5db', lineHeight: '1.5', textAlign: 'left' }}>
                Are you sure you really want to delete the raw ingredient <strong style={{ color: 'white' }}>{rawItemToDelete.name}</strong> from your inventory?
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', lineHeight: '1.4', textAlign: 'left' }}>
                This will permanently remove this ingredient and break any menu item recipes currently linked to it.
              </p>
            </div>

            {/* Modal Footer / CTAs */}
            <div style={{ padding: '0 20px 20px 20px', display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                className="btn-primary" 
                onClick={() => {
                  handleDeleteRawIngredient(rawItemToDelete.id);
                  setRawItemToDelete(null);
                }}
                style={{ flex: 1, background: '#ef4444', color: 'white', height: '44px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Yes, Delete
              </button>
              <button 
                type="button"
                className="btn-select" 
                onClick={() => setRawItemToDelete(null)}
                style={{ flex: 1, border: '1px solid rgba(255,255,255,0.15)', height: '44px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'transparent' }}
              >
                No, Keep It
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRINT RECEIPT BILL MODAL COMPONENT ──────────────────────────────────────────
export function PrintBillModal({ order, cafe, menuItems, formatPrice, onClose, onApproveDiscount, isWaiter = false }) {
  const [taxRate, setTaxRate] = useState(
    cafe?.currency === 'INR' ? 5 :
    cafe?.currency === 'NPR' ? 13 : 8
  );
  const [taxType, setTaxType] = useState(
    cafe?.currency === 'INR' ? 'GST' :
    cafe?.currency === 'NPR' ? 'VAT' : 'Sales Tax'
  );
  
  // Parse items
  const parsedItems = [];
  const regex = /(\d+)x\s+([^,\n([)]+)(?:\s*\(([^)]+)\))?/g;
  let match;
  const itemsText = order.items || '';
  let foundAny = false;
  
  while ((match = regex.exec(itemsText)) !== null) {
    const qty = parseInt(match[1]);
    const name = match[2].trim();
    const portion = match[3] ? match[3].trim() : null;
    
    const menuItem = menuItems.find(m => m.name.toLowerCase() === name.toLowerCase());
    parsedItems.push({
      qty,
      name,
      portion,
      price: menuItem ? menuItem.price : (order.total_price / qty),
      total: menuItem ? (menuItem.price * qty) : order.total_price
    });
    if (menuItem) foundAny = true;
  }
  
  // Calculate subtotal
  let subtotal = 0;
  if (foundAny) {
    subtotal = parsedItems.reduce((acc, pi) => acc + pi.total, 0);
  } else {
    subtotal = order.total_price;
    // back-calculate if discount was applied
    if (itemsText.includes('Discount Applied')) {
      const discountPercent = cafe?.discount_percentage || 20;
      subtotal = subtotal / (1 - (discountPercent / 100));
    } else if (itemsText.includes('Voucher Applied')) {
      subtotal = subtotal / 0.80;
    }
  }

  // Discount toggles
  const hasDiscountInText = itemsText.includes('Discount Applied') || itemsText.includes('Voucher Applied');
  const [isDiscountApplied, setIsDiscountApplied] = useState(hasDiscountInText);
  const [discountPercent, setDiscountPercent] = useState(() => {
    if (itemsText.includes('Voucher Applied')) return 20;
    return cafe?.discount_percentage || 20;
  });

  // UGC Verification check
  const isUgcDiscountClaimed = itemsText.includes('UGC Discount Applied') || 
    (cafe?.discount_min_items > 0 && parsedItems.reduce((acc, pi) => acc + pi.qty, 0) >= cafe?.discount_min_items);
  const hasUploadedPhotos = order.ugc_image && JSON.parse(order.ugc_image).length > 0;
  const isUgcMismatch = isUgcDiscountClaimed && !hasUploadedPhotos;

  const handleRevokeDiscount = () => {
    setIsDiscountApplied(false);
  };

  // Re-compute calculations
  const discountAmount = isDiscountApplied ? (subtotal * (discountPercent / 100)) : 0;
  const priceAfterDiscount = subtotal - discountAmount;
  const taxAmount = priceAfterDiscount * (taxRate / 100);
  const grandTotal = priceAfterDiscount + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bill-modal-overlay animated-fade-in" onClick={onClose}>
      <div className="bill-modal-card glass-card animated-zoom-in" onClick={(e) => e.stopPropagation()} style={{ background: '#111827', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="bill-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* UGC warning panel */}
          {isUgcMismatch && isDiscountApplied && (
            <div className="bill-ugc-warning-banner">
              <span>⚠️ <strong>UGC Warning:</strong> Applied discount but uploaded <strong>0 photos</strong>.</span>
              <button type="button" onClick={handleRevokeDiscount}>Revoke Discount</button>
            </div>
          )}

          {/* Printable Bill Wrapper */}
          <div className="printable-bill-wrapper">
            <div className="bill-header">
              <h1>{cafe?.name || 'Cafe & Restro'}</h1>
              {cafe?.description && <p>{cafe.description}</p>}
              {cafe?.location && <p>Branch: {cafe.location}</p>}
              {cafe?.phone && <p>Ph: {cafe.phone}</p>}
            </div>
            
            <div className="bill-meta">
              <div className="bill-meta-row">
                <span><strong>Invoice:</strong> #BILL-{order.id.toString().slice(-4)}</span>
                <span><strong>Date:</strong> {new Date(order.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="bill-meta-row">
                <span><strong>Table:</strong> {order.table_number}</span>
                <span><strong>Time:</strong> {new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="bill-meta-row">
                <span><strong>Staff:</strong> {isWaiter ? 'Waiter Service' : 'Admin'}</span>
                <span><strong>Status:</strong> {order.status.toUpperCase()}</span>
              </div>
            </div>

            <table className="bill-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th className="num-col" style={{ width: '40px' }}>Qty</th>
                  <th className="num-col" style={{ width: '70px' }}>Rate</th>
                  <th className="num-col" style={{ width: '80px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.length > 0 ? (
                  parsedItems.map((pi, idx) => (
                    <tr key={idx}>
                      <td>
                        {pi.name}
                        {pi.portion && <span style={{ fontSize: '0.75rem', display: 'block', color: '#6b7280' }}>({pi.portion})</span>}
                      </td>
                      <td className="num-col">{pi.qty}</td>
                      <td className="num-col">{formatPrice(pi.price)}</td>
                      <td className="num-col">{formatPrice(pi.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>{order.items}</td>
                    <td className="num-col">1</td>
                    <td className="num-col">{formatPrice(subtotal)}</td>
                    <td className="num-col">{formatPrice(subtotal)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="bill-totals">
              <div className="bill-totals-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              {isDiscountApplied && (
                <div className="bill-totals-row" style={{ color: '#ef4444' }}>
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="bill-totals-row">
                <span>
                  {taxType} ({taxRate}%)
                  {taxType === 'GST' && <span style={{ fontSize: '0.7rem', display: 'block', color: '#4b5563' }}>(CGST {taxRate/2}%, SGST {taxRate/2}%)</span>}
                </span>
                <span>{formatPrice(taxAmount)}</span>
              </div>

              <div className="bill-totals-row grand-total">
                <span>NET PAYABLE</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div className="bill-footer">
              <p>{cafe?.footer_message || 'Thank You For Dining With Us!'}</p>
              <p>Powered by Antigravity QR Menu SaaS</p>
            </div>
          </div>

          {/* Interactive Controls Overlay for Waiter/Admin (Hidden during print) */}
          <div className="bill-controls-box">
            <h3>⚙️ Bill Customization Settings</h3>
            
            <div className="bill-control-group">
              <span className="bill-control-label">Tax Country Scheme:</span>
              <select 
                className="bill-control-input"
                value={`${taxType}-${taxRate}`} 
                onChange={(e) => {
                  const [type, rate] = e.target.value.split('-');
                  setTaxType(type);
                  setTaxRate(parseFloat(rate));
                }}
              >
                <option value="Sales Tax-8">United States (8% Sales Tax)</option>
                <option value="GST-5">India GST (5% standard)</option>
                <option value="GST-18">India GST (18% fine-dine)</option>
                <option value="VAT-13">Nepal VAT (13% VAT)</option>
                <option value="No Tax-0">Exempt / No Tax (0%)</option>
              </select>
            </div>

            <div className="bill-control-group">
              <span className="bill-control-label">
                <input 
                  type="checkbox" 
                  checked={isDiscountApplied}
                  onChange={(e) => setIsDiscountApplied(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', margin: '0 6px 0 0' }}
                />
                Apply Discount
              </span>
              {isDiscountApplied && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={discountPercent} 
                    onChange={(e) => setDiscountPercent(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bill-control-input"
                    style={{ width: '60px', padding: '4px' }}
                  />
                  <span>%</span>
                </div>
              )}
            </div>
          </div>

          <div className="bill-actions-row">
            <button 
              type="button"
              className="btn-primary" 
              onClick={handlePrint}
              style={{ background: '#3b82f6', color: 'white' }}
            >
              🖨️ Print Bill Receipt
            </button>
            
            {onApproveDiscount && ['pending', 'preparing', 'ready', 'completed', 'bill_requested'].includes(order.status) && (
              <button 
                type="button"
                className="btn-primary" 
                onClick={() => onApproveDiscount(order.id, isDiscountApplied, discountPercent, grandTotal)}
                style={{ background: '#10b981', color: 'white' }}
              >
                ✅ Approve & Close Order
              </button>
            )}

            <button 
              type="button"
              className="btn-select" 
              onClick={onClose}
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
