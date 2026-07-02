import React, { createContext, useContext, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SupabaseContext = createContext(null);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key are required! Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// BroadcastChannel for cross-tab realtime simulation in fallback mode
const realtimeBroadcast = new BroadcastChannel('supabase-realtime-mock');

export const SupabaseProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // LocalStorage Mock Helpers
  const getMockData = (table) => {
    const data = localStorage.getItem(`mock_db_${table}`);
    return data ? JSON.parse(data) : [];
  };

  const setMockData = (table, data) => {
    localStorage.setItem(`mock_db_${table}`, JSON.stringify(data));
  };

  // Cafes CRUD
  const fetchCafes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('cafes')
        .select('*')
        .order('name');
      if (err) {
        if (err.code === 'PGRST205') {
          console.warn('cafes table not found. Falling back to LocalStorage.');
          return getMockData('cafes');
        }
        throw err;
      }
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching cafes:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createCafe = async (cafe) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('cafes')
        .insert([cafe])
        .select();
      if (err) {
        if (err.code === 'PGRST205') {
          const list = getMockData('cafes');
          const newCafe = { 
            id: Date.now(), 
            ...cafe, 
            created_at: new Date().toISOString() 
          };
          list.push(newCafe);
          setMockData('cafes', list);
          return newCafe;
        }
        throw err;
      }
      return data[0];
    } catch (err) {
      setError(err.message);
      console.error('Error creating cafe:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCafe = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('cafes')
        .update(updates)
        .eq('id', id)
        .select();
      if (err) {
        if (err.code === 'PGRST205') {
          const list = getMockData('cafes');
          const updated = list.map(c => c.id === id ? { ...c, ...updates } : c);
          setMockData('cafes', updated);
          return updated.find(c => c.id === id);
        }
        throw err;
      }
      return data[0];
    } catch (err) {
      setError(err.message);
      console.error('Error updating cafe:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCafe = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('cafes')
        .delete()
        .eq('id', id);
      if (err) {
        if (err.code === 'PGRST205') {
          const list = getMockData('cafes');
          setMockData('cafes', list.filter(c => c.id !== id));
          return true;
        }
        throw err;
      }
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting cafe:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Staff CRUD
  const fetchStaff = async (cafeId = null) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('cafe_staff').select('*');
      if (cafeId) {
        query = query.eq('cafe_id', cafeId);
      }
      const { data, error: err } = await query;
      if (err) {
        if (err.code === 'PGRST205') {
          console.warn('cafe_staff table not found. Falling back to LocalStorage.');
          let list = getMockData('cafe_staff');
          if (cafeId) {
            list = list.filter(staff => staff.cafe_id === cafeId || staff.cafe_id === parseInt(cafeId));
          }
          return list;
        }
        throw err;
      }
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching staff:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createStaff = async (staffMember) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('cafe_staff')
        .insert([staffMember])
        .select();
      if (err) {
        if (err.code === 'PGRST205') {
          const list = getMockData('cafe_staff');
          const newStaff = { 
            id: Date.now(), 
            ...staffMember, 
            created_at: new Date().toISOString() 
          };
          list.push(newStaff);
          setMockData('cafe_staff', list);
          return newStaff;
        }
        throw err;
      }
      return data[0];
    } catch (err) {
      setError(err.message);
      console.error('Error creating staff member:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteStaff = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('cafe_staff')
        .delete()
        .eq('id', id);
      if (err) {
        if (err.code === 'PGRST205') {
          const list = getMockData('cafe_staff');
          setMockData('cafe_staff', list.filter(staff => staff.id !== id));
          return true;
        }
        throw err;
      }
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting staff member:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Menu Items CRUD
  const fetchMenuItems = async (cafeId = null) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('menu_items').select('*');
      if (cafeId) {
        query = query.eq('cafe_id', cafeId);
      }
      const { data, error: err } = await query.order('category').order('name');
      if (err) {
        if (err.code === 'PGRST205') {
          console.warn('menu_items table not found. Falling back to LocalStorage.');
          let list = getMockData('menu_items');
          if (cafeId) {
            list = list.filter(item => item.cafe_id === cafeId || item.cafe_id === parseInt(cafeId));
          }
          return list;
        }
        throw err;
      }

      // Merge with local stock overrides
      const overrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
      const mergedData = data.map(item => {
        const itemOverride = overrides[item.id];
        return {
          ...item,
          stock: itemOverride && itemOverride.stock !== undefined ? itemOverride.stock : item.stock,
          low_stock_threshold: itemOverride && itemOverride.low_stock_threshold !== undefined ? itemOverride.low_stock_threshold : item.low_stock_threshold,
          stock_unit: itemOverride && itemOverride.stock_unit !== undefined ? itemOverride.stock_unit : (item.stock_unit || 'pcs')
        };
      });
      return mergedData;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching menu items:', err);
      let list = getMockData('menu_items');
      if (cafeId) {
        list = list.filter(item => item.cafe_id === cafeId || item.cafe_id === parseInt(cafeId));
      }
      return list;
    } finally {
      setLoading(false);
    }
  };

  const createMenuItem = async (item) => {
    setLoading(true);
    setError(null);
    // Separate stock tracking fields for schema safety
    const { stock, low_stock_threshold, stock_unit, ...supabaseItem } = item;
    try {
      const { data, error: err } = await supabase
        .from('menu_items')
        .insert([supabaseItem])
        .select();
      if (err) {
        if (err.code === 'PGRST205' || err.message.includes('column')) {
          const list = getMockData('menu_items');
          const newItem = { 
            id: Date.now(), 
            ...item, 
            created_at: new Date().toISOString() 
          };
          list.push(newItem);
          setMockData('menu_items', list);
          return newItem;
        }
        throw err;
      }
      const createdItem = data[0];
      // Store the stock override locally associated with the new ID
      if (stock !== undefined || low_stock_threshold !== undefined || stock_unit !== undefined) {
        const overrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
        overrides[createdItem.id] = {
          stock: stock !== undefined ? stock : null,
          low_stock_threshold: low_stock_threshold !== undefined ? low_stock_threshold : null,
          stock_unit: stock_unit !== undefined ? stock_unit : 'pcs'
        };
        localStorage.setItem('menu_items_stock_overrides', JSON.stringify(overrides));
      }
      return {
        ...createdItem,
        stock,
        low_stock_threshold,
        stock_unit: stock_unit || 'pcs'
      };
    } catch (err) {
      setError(err.message);
      console.error('Error creating menu item:', err);
      const list = getMockData('menu_items');
      const newItem = { 
        id: Date.now(), 
        ...item, 
        created_at: new Date().toISOString() 
      };
      list.push(newItem);
      setMockData('menu_items', list);
      return newItem;
    } finally {
      setLoading(false);
    }
  };

  const updateMenuItem = async (id, updates) => {
    setLoading(true);
    setError(null);
    // Separate stock tracking fields
    const { stock, low_stock_threshold, stock_unit, ...supabaseUpdates } = updates;
    // Save to overrides immediately
    if (stock !== undefined || low_stock_threshold !== undefined || stock_unit !== undefined) {
      const overrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
      overrides[id] = {
        ...overrides[id],
        ...(stock !== undefined ? { stock } : {}),
        ...(low_stock_threshold !== undefined ? { low_stock_threshold } : {}),
        ...(stock_unit !== undefined ? { stock_unit } : {})
      };
      localStorage.setItem('menu_items_stock_overrides', JSON.stringify(overrides));
    }
    try {
      let updatedItem = null;
      if (Object.keys(supabaseUpdates).length > 0) {
        const { data, error: err } = await supabase
          .from('menu_items')
          .update(supabaseUpdates)
          .eq('id', id)
          .select();
        if (err) {
          if (err.code === 'PGRST205' || err.message.includes('column')) {
            const list = getMockData('menu_items');
            const updated = list.map(m => m.id === id ? { ...m, ...updates } : m);
            setMockData('menu_items', updated);
            return updated.find(m => m.id === id);
          }
          throw err;
        }
        updatedItem = data[0];
      } else {
        const { data, error: err } = await supabase
          .from('menu_items')
          .select('*')
          .eq('id', id);
        if (!err && data && data.length > 0) {
          updatedItem = data[0];
        } else {
          const list = getMockData('menu_items');
          updatedItem = list.find(m => m.id === id);
        }
      }
      if (!updatedItem) return null;
      const overrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
      const itemOverride = overrides[id] || {};
      return {
        ...updatedItem,
        stock: itemOverride.stock !== undefined ? itemOverride.stock : updatedItem.stock,
        low_stock_threshold: itemOverride.low_stock_threshold !== undefined ? itemOverride.low_stock_threshold : updatedItem.low_stock_threshold,
        stock_unit: itemOverride.stock_unit !== undefined ? itemOverride.stock_unit : (updatedItem.stock_unit || 'pcs')
      };
    } catch (err) {
      console.warn('Fallback update for menu item:', err);
      const list = getMockData('menu_items');
      const updated = list.map(m => m.id === id ? { ...m, ...updates } : m);
      setMockData('menu_items', updated);
      return updated.find(m => m.id === id);
    } finally {
      setLoading(false);
    }
  };

  const deleteMenuItem = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (err) {
        if (err.code === 'PGRST205') {
          const list = getMockData('menu_items');
          setMockData('menu_items', list.filter(m => m.id !== id));
          return true;
        }
        throw err;
      }
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting menu item:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Orders CRUD
  const fetchOrders = async (cafeId = null) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('orders').select('*');
      if (cafeId) {
        query = query.eq('cafe_id', cafeId);
      }
      const { data, error: err } = await query.order('created_at', { ascending: false });
      if (err) {
        if (err.code === 'PGRST205') {
          console.warn('orders table not found. Falling back to LocalStorage.');
          let list = getMockData('orders');
          if (cafeId) {
            list = list.filter(order => order.cafe_id === cafeId || order.cafe_id === parseInt(cafeId));
          }
          return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        throw err;
      }
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching orders:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (order) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .insert([order])
        .select();
      if (err) {
        if (err.code === 'PGRST205') {
          const list = getMockData('orders');
          const newOrder = { 
            id: Date.now(), 
            ...order, 
            created_at: new Date().toISOString() 
          };
          list.push(newOrder);
          setMockData('orders', list);
          
          // Send mock realtime event
          realtimeBroadcast.postMessage({
            eventType: 'INSERT',
            new: newOrder,
            old: {}
          });
          
          return newOrder;
        }
        throw err;
      }
      return data[0];
    } catch (err) {
      setError(err.message);
      console.error('Error creating order:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select();
      if (err) {
        if (err.code === 'PGRST205') {
          const list = getMockData('orders');
          const updated = list.map(o => o.id === id ? { ...o, status } : o);
          setMockData('orders', updated);
          const updatedOrder = updated.find(o => o.id === id);
          
          // Send mock realtime event
          realtimeBroadcast.postMessage({
            eventType: 'UPDATE',
            new: updatedOrder,
            old: { id }
          });

          return updatedOrder;
        }
        throw err;
      }
      return data[0];
    } catch (err) {
      setError(err.message);
      console.error('Error updating order status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select();
      if (err) {
        console.warn('Supabase updateOrder failed, falling back to LocalStorage:', err.message);
        const list = getMockData('orders');
        const updated = list.map(o => String(o.id) === String(id) ? { ...o, ...updates } : o);
        setMockData('orders', updated);
        const updatedOrder = updated.find(o => String(o.id) === String(id));
        
        // Send mock realtime event
        if (updatedOrder) {
          realtimeBroadcast.postMessage({
            eventType: 'UPDATE',
            new: updatedOrder,
            old: { id }
          });
        }
        
        return updatedOrder;
      }
      return data[0];
    } catch (err) {
      setError(err.message);
      console.error('Error updating order:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      if (err) {
        if (err.code === 'PGRST205') {
          const list = getMockData('orders');
          setMockData('orders', list.filter(o => o.id !== id));
          
          // Send mock realtime event
          realtimeBroadcast.postMessage({
            eventType: 'DELETE',
            new: {},
            old: { id }
          });
          
          return true;
        }
        throw err;
      }
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting order:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Realtime Orders subscription
  const subscribeToOrders = (cafeId, onEvent) => {
    let channel;
    let filter = undefined;
    if (cafeId) {
      filter = `cafe_id=eq.${cafeId}`;
    }

    try {
      channel = supabase
        .channel('orders-realtime-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            ...(filter ? { filter } : {})
          },
          (payload) => {
            onEvent(payload);
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Supabase Realtime not available. Using local BroadcastChannel instead.");
    }

    // Fallback broadcast channel listener for local tabs
    const handleBroadcastMessage = (e) => {
      const payload = e.data;
      if (cafeId && payload.new && payload.new.cafe_id !== parseInt(cafeId) && payload.new.cafe_id !== cafeId) {
        return;
      }
      onEvent(payload);
    };

    realtimeBroadcast.addEventListener('message', handleBroadcastMessage);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      realtimeBroadcast.removeEventListener('message', handleBroadcastMessage);
    };
  };

  const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality to keep it around 15-20KB
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file, bucket = 'logos') => {
    setLoading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadErr) {
        console.warn('Supabase storage upload failed, falling back to base64 encoding with compression:', uploadErr.message);
        return compressAndConvertToBase64(file);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.warn('Storage exception. Falling back to base64 encoding with compression:', err.message);
      return compressAndConvertToBase64(file);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    supabase,
    loading,
    error,
    setError,
    fetchCafes,
    createCafe,
    updateCafe,
    deleteCafe,
    fetchMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    subscribeToOrders,
    uploadImage,
    fetchStaff,
    createStaff,
    deleteStaff
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
