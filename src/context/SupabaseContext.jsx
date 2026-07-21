/* eslint-disable react/only-export-components */
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

  const syncLocalOverridesToDatabase = async () => {
    // 1. Sync Cafes Overrides
    const cafeOverrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
    const cafeIds = Object.keys(cafeOverrides);
    if (cafeIds.length > 0) {
      console.log(`Starting migration of ${cafeIds.length} cafe overrides to database...`);
      for (const id of cafeIds) {
        const updates = cafeOverrides[id];
        try {
          const payload = {};
          if (updates.admin_username !== undefined) payload.admin_username = updates.admin_username;
          if (updates.footer_message !== undefined) payload.footer_message = updates.footer_message;
          if (updates.font_family !== undefined) payload.font_family = updates.font_family;
          if (updates.logo_placement !== undefined) payload.logo_placement = updates.logo_placement;
          if (updates.table_merges !== undefined) payload.table_merges = updates.table_merges;
          if (updates.qr_domain !== undefined) payload.qr_domain = updates.qr_domain;

          if (Object.keys(payload).length > 0) {
            const { error: err } = await supabase
              .from('cafes')
              .update(payload)
              .eq('id', id);
            
            if (!err) {
              delete cafeOverrides[id];
            } else {
              console.warn(`Failed to migrate cafe override for ID ${id}:`, err.message);
              if (err.code === '42703' || err.message.includes('column')) {
                break; // Missing columns on DB, stop migration for now
              }
            }
          } else {
            delete cafeOverrides[id];
          }
        } catch (err) {
          console.error(`Error migrating cafe override for ${id}:`, err);
        }
      }
      if (Object.keys(cafeOverrides).length === 0) {
        localStorage.removeItem('cafes_saas_overrides');
      } else {
        localStorage.setItem('cafes_saas_overrides', JSON.stringify(cafeOverrides));
      }
    }

    // 2. Sync Menu Items Overrides
    const itemOverrides = JSON.parse(localStorage.getItem('menu_items_local_overrides') || '{}');
    const stockOverrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
    const itemIds = Array.from(new Set([...Object.keys(itemOverrides), ...Object.keys(stockOverrides)]));
    
    if (itemIds.length > 0) {
      console.log(`Starting migration of ${itemIds.length} menu item overrides to database...`);
      for (const id of itemIds) {
        const itemOverride = itemOverrides[id] || {};
        const stockOverride = stockOverrides[id] || {};
        const merged = {
          ...itemOverride,
          ...stockOverride
        };
        try {
          const updates = {};
          if (merged.stock !== undefined && merged.stock !== null) updates.stock = merged.stock;
          if (merged.low_stock_threshold !== undefined && merged.low_stock_threshold !== null) updates.low_stock_threshold = merged.low_stock_threshold;
          if (merged.stock_unit !== undefined) updates.stock_unit = merged.stock_unit;
          if (merged.recipe !== undefined) updates.recipe = merged.recipe;
          if (merged.availability_status !== undefined) updates.availability_status = merged.availability_status;

          if (Object.keys(updates).length > 0) {
            const { error: err } = await supabase
              .from('menu_items')
              .update(updates)
              .eq('id', id);
            
            if (!err) {
              delete itemOverrides[id];
              delete stockOverrides[id];
            } else {
              console.warn(`Failed to migrate menu item override for ID ${id}:`, err.message);
              if (err.code === '42703' || err.message.includes('column')) {
                break; // Missing columns on DB, stop migration for now
              }
            }
          } else {
            delete itemOverrides[id];
            delete stockOverrides[id];
          }
        } catch (err) {
          console.error(`Error migrating menu item override for ${id}:`, err);
        }
      }
      
      if (Object.keys(itemOverrides).length === 0) {
        localStorage.removeItem('menu_items_local_overrides');
      } else {
        localStorage.setItem('menu_items_local_overrides', JSON.stringify(itemOverrides));
      }
      
      if (Object.keys(stockOverrides).length === 0) {
        localStorage.removeItem('menu_items_stock_overrides');
      } else {
        localStorage.setItem('menu_items_stock_overrides', JSON.stringify(stockOverrides));
      }
    }
  };

  React.useEffect(() => {
    syncLocalOverridesToDatabase();
  }, []);

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
      
      let rawCafes = [];
      if (err) {
        console.warn('cafes query error. Falling back to LocalStorage:', err);
        rawCafes = getMockData('cafes');
      } else {
        rawCafes = data;
      }

      // Merge local overrides (admin_username, footer_message)
      const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
      return rawCafes.map(cafe => {
        const merged = {
          ...cafe,
          ...(overrides[cafe.id] || {})
        };
        if (!merged.table_merges) {
          merged.table_merges = [];
        }
        if (!merged.qr_domain) {
          merged.qr_domain = 'https://qr-menu-saas.vercel.app';
        }
        return merged;
      });
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
      // Generate a unique activation key using cryptographically secure values
      let activationKey = cafe.activation_key;
      if (!activationKey) {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
          attempts++;
          const array = new Uint32Array(2);
          self.crypto.getRandomValues(array);
          const hex1 = array[0].toString(16).toUpperCase().padStart(8, '0');
          const hex2 = array[1].toString(16).toUpperCase().padStart(8, '0');
          const candidateKey = `ACT-${hex1.slice(0, 4)}-${hex1.slice(4, 8)}-${hex2.slice(0, 4)}`;

          // Check if candidate key exists in Supabase
          try {
            const { data, error: dbErr } = await supabase
              .from('cafes')
              .select('id')
              .eq('activation_key', candidateKey);
            if (!dbErr && (!data || data.length === 0)) {
              activationKey = candidateKey;
              isUnique = true;
            }
          } catch {
            // Fallback: If offline or table missing, check localStorage mock data list
            const mockList = getMockData('cafes');
            const exists = mockList.some(c => c.activation_key === candidateKey);
            if (!exists) {
              activationKey = candidateKey;
              isUnique = true;
            }
          }
        }
        // General fallback if checking failed
        if (!activationKey) {
          const randHex = Math.random().toString(36).substring(2, 10).toUpperCase();
          activationKey = `ACT-FBK-${randHex}`;
        }
      }

      const expiresAt = cafe.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const isActivated = cafe.is_activated !== undefined ? cafe.is_activated : false;

      const updatedCafePayload = {
        ...cafe,
        activation_key: activationKey,
        is_activated: isActivated,
        expires_at: expiresAt
      };

      // Try inserting with all fields first (supporting new schema columns)
      let { data, error: err } = await supabase
        .from('cafes')
        .insert([updatedCafePayload])
        .select();

      // If database is not migrated yet (missing columns), fall back to stripped payload and local overrides
      if (err && (err.code === '42703' || err.message.includes('column'))) {
        console.warn('New columns missing in cafes table. Inserting cleaned payload and saving local overrides.');
        const { admin_username, footer_message, font_family, logo_placement, table_merges, qr_domain, ...cleanPayload } = updatedCafePayload;
        const cleanRes = await supabase.from('cafes').insert([cleanPayload]).select();
        data = cleanRes.data;
        err = cleanRes.error;

        if (!err && data && data[0]) {
          const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
          overrides[data[0].id] = {
            ...(overrides[data[0].id] || {}),
            ...(admin_username !== undefined ? { admin_username } : {}),
            ...(footer_message !== undefined ? { footer_message } : {}),
            ...(font_family !== undefined ? { font_family } : {}),
            ...(logo_placement !== undefined ? { logo_placement } : {}),
            ...(table_merges !== undefined ? { table_merges } : {}),
            ...(qr_domain !== undefined ? { qr_domain } : {})
          };
          localStorage.setItem('cafes_saas_overrides', JSON.stringify(overrides));
        }
      }

      let createdCafe = null;
      if (err) {
        console.warn('createCafe query error. Falling back to LocalStorage:', err);
        const list = getMockData('cafes');
        createdCafe = { 
          id: Date.now(), 
          ...updatedCafePayload, 
          created_at: new Date().toISOString() 
        };
        list.push(createdCafe);
        setMockData('cafes', list);
      } else {
        createdCafe = data[0];
      }

      if (createdCafe) {
        const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
        createdCafe = {
          ...createdCafe,
          ...(overrides[createdCafe.id] || {})
        };
        if (!createdCafe.table_merges) {
          createdCafe.table_merges = [];
        }
        return createdCafe;
      }
      return null;
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
      let updatedCafe = null;
      let { data, error: err } = await supabase
        .from('cafes')
        .update(updates)
        .eq('id', id)
        .select();

      // If database is not migrated yet (missing columns), fall back to stripped updates and local overrides
      if (err && (err.code === '42703' || err.message.includes('column'))) {
        console.warn('New columns missing in cafes table for update. Updating cleaned payload and saving local overrides.');
        const { admin_username, footer_message, font_family, logo_placement, table_merges, qr_domain, ...cleanUpdates } = updates;
        
        let cleanRes = { data: null, error: null };
        if (Object.keys(cleanUpdates).length > 0) {
          cleanRes = await supabase.from('cafes').update(cleanUpdates).eq('id', id).select();
        } else {
          cleanRes = await supabase.from('cafes').select('*').eq('id', id);
        }
        data = cleanRes.data;
        err = cleanRes.error;

        if (!err && data && data[0]) {
          const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
          overrides[id] = {
            ...(overrides[id] || {}),
            ...(admin_username !== undefined ? { admin_username } : {}),
            ...(footer_message !== undefined ? { footer_message } : {}),
            ...(font_family !== undefined ? { font_family } : {}),
            ...(logo_placement !== undefined ? { logo_placement } : {}),
            ...(table_merges !== undefined ? { table_merges } : {}),
            ...(qr_domain !== undefined ? { qr_domain } : {})
          };
          localStorage.setItem('cafes_saas_overrides', JSON.stringify(overrides));
        }
      }

      if (err) {
        console.warn('updateCafe query error. Falling back to LocalStorage:', err);
        const list = getMockData('cafes');
        const updated = list.map(c => c.id === id ? { ...c, ...updates } : c);
        setMockData('cafes', updated);
        updatedCafe = updated.find(c => c.id === id);
      } else {
        updatedCafe = data[0];
      }

      if (updatedCafe) {
        const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
        updatedCafe = {
          ...updatedCafe,
          ...(overrides[updatedCafe.id] || {})
        };
        if (!updatedCafe.table_merges) {
          updatedCafe.table_merges = [];
        }
      }
      return updatedCafe;
    } catch (err) {
      console.warn('updateCafe threw. Falling back to LocalStorage:', err.message);
      const list = getMockData('cafes');
      let target = list.find(c => c.id === id);
      if (!target) {
        try {
          const { data } = await supabase.from('cafes').select('*').eq('id', id).single();
          if (data) {
            target = data;
            list.push(data);
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (!target) {
        target = { id, name: updates.name || 'Cafe' };
        list.push(target);
      }

      const updated = list.map(c => c.id === id ? { ...c, ...updates } : c);
      setMockData('cafes', updated);
      let res = updated.find(c => c.id === id);
      if (res) {
        const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
        res = {
          ...res,
          ...(overrides[res.id] || {})
        };
        if (!res.table_merges) {
          res.table_merges = [];
        }
      }
      return res;
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

  const validateActivationKey = async (key) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('cafes')
        .select('*')
        .eq('activation_key', key)
        .single();

      if (err) {
        if (err.code === 'PGRST116') {
          return { success: false, message: '❌ Invalid activation key. Please check the code.' };
        }
        throw err;
      }

      if (data.is_activated) {
        return { success: false, message: '❌ This activation key has already been used.' };
      }

      const expiry = new Date(data.expires_at);
      if (expiry < new Date()) {
        return { success: false, message: '❌ This activation key has expired. Please contact support.' };
      }

      const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
      const cafe = {
        ...data,
        ...(overrides[data.id] || {})
      };

      return { success: true, cafe };
    } catch {
      // Fallback for mock data (LocalStorage mode)
      const mockList = getMockData('cafes');
      let target = mockList.find(c => c.activation_key === key);
      
      if (!target) {
        return { success: false, message: '❌ Invalid activation key. Please check the code.' };
      }
      
      if (target.is_activated) {
        return { success: false, message: '❌ This activation key has already been used.' };
      }

      const expiry = new Date(target.expires_at || (Date.now() + 365 * 24 * 60 * 60 * 1000));
      if (expiry < new Date()) {
        return { success: false, message: '❌ This activation key has expired.' };
      }

      const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
      target = {
        ...target,
        ...(overrides[target.id] || {})
      };

      return { success: true, cafe: target };
    } finally {
      setLoading(false);
    }
  };

  const verifyRecoveryKey = async (key) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('cafes')
        .select('*')
        .eq('activation_key', key)
        .single();

      if (err) {
        if (err.code === 'PGRST116') {
          return { success: false, message: '❌ Invalid activation key. Please check the code.' };
        }
        throw err;
      }

      const expiry = new Date(data.expires_at);
      if (expiry < new Date()) {
        return { success: false, message: '❌ This branch subscription has expired.' };
      }

      const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
      const cafe = {
        ...data,
        ...(overrides[data.id] || {})
      };

      return { success: true, cafe };
    } catch {
      // Fallback for mock data (LocalStorage mode)
      const mockList = getMockData('cafes');
      let target = mockList.find(c => c.activation_key === key);
      
      if (!target) {
        return { success: false, message: '❌ Invalid activation key. Please check the code.' };
      }
      
      const expiry = new Date(target.expires_at || (Date.now() + 365 * 24 * 60 * 60 * 1000));
      if (expiry < new Date()) {
        return { success: false, message: '❌ This branch subscription has expired.' };
      }

      const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
      target = {
        ...target,
        ...(overrides[target.id] || {})
      };

      return { success: true, cafe: target };
    } finally {
      setLoading(false);
    }
  };

  const fetchCafeByUsername = async (username) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('cafes')
        .select('*')
        .eq('admin_username', username.trim().toLowerCase())
        .maybeSingle();

      if (err) {
        console.warn('fetchCafeByUsername query error. Falling back to LocalStorage lookup:', err);
        const list = await fetchCafes();
        return list ? list.find(c => c.admin_username === username) || null : null;
      }

      if (data) {
        const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
        const cafe = {
          ...data,
          ...(overrides[data.id] || {})
        };
        if (!cafe.table_merges) {
          cafe.table_merges = [];
        }
        return cafe;
      }
      return null;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching cafe by username:', err);
      const list = await fetchCafes();
      return list ? list.find(c => c.admin_username === username) || null : null;
    } finally {
      setLoading(false);
    }
  };

  const fetchCafeById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('cafes')
        .select('*')
        .eq('id', id)
        .single();

      let cafe = null;
      if (err) {
        if (err.code === 'PGRST116') {
          return null;
        }
        // Fallback for mock data
        const mockList = getMockData('cafes');
        cafe = mockList.find(c => String(c.id) === String(id)) || null;
      } else {
        cafe = data;
      }

      if (cafe) {
        const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
        cafe = {
          ...cafe,
          ...(overrides[cafe.id] || {})
        };
        if (!cafe.table_merges) {
          cafe.table_merges = [];
        }
      }
      return cafe;
    } catch {
      // Fallback for mock data (LocalStorage mode)
      const mockList = getMockData('cafes');
      let cafe = mockList.find(c => String(c.id) === String(id)) || null;
      if (cafe) {
        const overrides = JSON.parse(localStorage.getItem('cafes_saas_overrides') || '{}');
        cafe = {
          ...cafe,
          ...(overrides[cafe.id] || {})
        };
      }
      return cafe;
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
          const stockOverrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
          const localOverrides = JSON.parse(localStorage.getItem('menu_items_local_overrides') || '{}');
          return list.map(item => {
            const itemOverride = {
              ...(stockOverrides[item.id] || {}),
              ...(localOverrides[item.id] || {})
            };
            return {
              ...item,
              stock: itemOverride.stock !== undefined ? itemOverride.stock : item.stock,
              low_stock_threshold: itemOverride.low_stock_threshold !== undefined ? itemOverride.low_stock_threshold : item.low_stock_threshold,
              stock_unit: itemOverride.stock_unit !== undefined ? itemOverride.stock_unit : (item.stock_unit || 'pcs'),
              recipe: itemOverride.recipe !== undefined ? itemOverride.recipe : (item.recipe || []),
              availability_status: itemOverride.availability_status !== undefined ? itemOverride.availability_status : (item.availability_status || (item.is_available ? 'available' : 'out_of_stock'))
            };
          });
        }
        throw err;
      }

      // Merge with local overrides
      const stockOverrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
      let localOverrides = JSON.parse(localStorage.getItem('menu_items_local_overrides') || '{}');

      // One-time migration: remove stale null/zero stock entries that were saved by old buggy code.
      // These entries cause false "Out of Stock" badges for items without an explicitly set stock.
      let overridesUpdated = false;
      Object.keys(localOverrides).forEach(id => {
        const entry = localOverrides[id];
        if (entry && 'stock' in entry && (entry.stock === null || entry.stock === 0) && !entry._stockExplicitlySet) {
          delete entry.stock;
          overridesUpdated = true;
        }
      });
      if (overridesUpdated) {
        localStorage.setItem('menu_items_local_overrides', JSON.stringify(localOverrides));
      }

      const mergedData = data.map(item => {
        const itemOverride = {
          ...(stockOverrides[item.id] || {}),
          ...(localOverrides[item.id] || {})
        };
        // Treat null override stock as "unlimited" (user never set a stock value).
        // Only apply a numeric stock override if it was explicitly set to a number.
        const resolvedStock = (itemOverride.stock !== undefined && itemOverride.stock !== null)
          ? itemOverride.stock
          : (item.stock !== undefined && item.stock !== null ? item.stock : undefined);
        return {
          ...item,
          stock: resolvedStock,
          low_stock_threshold: itemOverride.low_stock_threshold !== undefined ? itemOverride.low_stock_threshold : item.low_stock_threshold,
          stock_unit: itemOverride.stock_unit !== undefined ? itemOverride.stock_unit : (item.stock_unit || 'pcs'),
          recipe: itemOverride.recipe !== undefined ? itemOverride.recipe : [],
          availability_status: itemOverride.availability_status !== undefined ? itemOverride.availability_status : (item.is_available ? 'available' : 'out_of_stock')
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
      const stockOverrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
      const localOverrides = JSON.parse(localStorage.getItem('menu_items_local_overrides') || '{}');
      return list.map(item => {
        const itemOverride = {
          ...(stockOverrides[item.id] || {}),
          ...(localOverrides[item.id] || {})
        };
        return {
          ...item,
          stock: itemOverride.stock !== undefined ? itemOverride.stock : item.stock,
          low_stock_threshold: itemOverride.low_stock_threshold !== undefined ? itemOverride.low_stock_threshold : item.low_stock_threshold,
          stock_unit: itemOverride.stock_unit !== undefined ? itemOverride.stock_unit : (item.stock_unit || 'pcs'),
          recipe: itemOverride.recipe !== undefined ? itemOverride.recipe : (item.recipe || []),
          availability_status: itemOverride.availability_status !== undefined ? itemOverride.availability_status : (item.availability_status || (item.is_available ? 'available' : 'out_of_stock'))
        };
      });
    } finally {
      setLoading(false);
    }
  };

  const createMenuItem = async (item) => {
    setLoading(true);
    setError(null);
    try {
      let { data, error: err } = await supabase
        .from('menu_items')
        .insert([item])
        .select();

      // If database is not migrated yet (missing columns), fall back to stripped payload and local overrides
      if (err && (err.code === '42703' || err.message.includes('column'))) {
        console.warn('New columns missing in menu_items table. Inserting cleaned payload and saving local overrides.');
        const { stock, low_stock_threshold, stock_unit, recipe, availability_status, ...cleanItem } = item;
        const cleanRes = await supabase.from('menu_items').insert([cleanItem]).select();
        data = cleanRes.data;
        err = cleanRes.error;

        if (!err && data && data[0]) {
          const overrides = JSON.parse(localStorage.getItem('menu_items_local_overrides') || '{}');
          const overrideEntry = {
            stock_unit: stock_unit !== undefined ? stock_unit : 'pcs',
            recipe: recipe !== undefined ? recipe : [],
            availability_status: availability_status !== undefined ? availability_status : (data[0].is_available ? 'available' : 'out_of_stock')
          };
          if (stock !== undefined && stock !== null) {
            overrideEntry.stock = stock;
            overrideEntry._stockExplicitlySet = true;
          }
          if (low_stock_threshold !== undefined && low_stock_threshold !== null) {
            overrideEntry.low_stock_threshold = low_stock_threshold;
          }
          overrides[data[0].id] = overrideEntry;
          localStorage.setItem('menu_items_local_overrides', JSON.stringify(overrides));
        }
      }

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
      
      const stockOverrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
      const localOverrides = JSON.parse(localStorage.getItem('menu_items_local_overrides') || '{}');
      const itemOverride = {
        ...(stockOverrides[createdItem.id] || {}),
        ...(localOverrides[createdItem.id] || {})
      };

      return {
        ...createdItem,
        stock: (itemOverride.stock !== undefined && itemOverride.stock !== null) ? itemOverride.stock : createdItem.stock,
        low_stock_threshold: itemOverride.low_stock_threshold !== undefined ? itemOverride.low_stock_threshold : createdItem.low_stock_threshold,
        stock_unit: itemOverride.stock_unit !== undefined ? itemOverride.stock_unit : (createdItem.stock_unit || 'pcs'),
        recipe: itemOverride.recipe !== undefined ? itemOverride.recipe : (createdItem.recipe || []),
        availability_status: itemOverride.availability_status !== undefined ? itemOverride.availability_status : (createdItem.availability_status || (createdItem.is_available ? 'available' : 'out_of_stock'))
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
    try {
      let updatedItem = null;
      let { data, error: err } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select();

      // If database is not migrated yet (missing columns), fall back to stripped updates and local overrides
      if (err && (err.code === '42703' || err.message.includes('column'))) {
        console.warn('New columns missing in menu_items table for update. Updating cleaned payload and saving local overrides.');
        const { stock, low_stock_threshold, stock_unit, recipe, availability_status, ...cleanUpdates } = updates;
        
        let cleanRes = { data: null, error: null };
        if (Object.keys(cleanUpdates).length > 0) {
          cleanRes = await supabase.from('menu_items').update(cleanUpdates).eq('id', id).select();
        } else {
          cleanRes = await supabase.from('menu_items').select('*').eq('id', id);
        }
        data = cleanRes.data;
        err = cleanRes.error;

        if (!err && data && data[0]) {
          const overrides = JSON.parse(localStorage.getItem('menu_items_local_overrides') || '{}');
          overrides[id] = {
            ...(overrides[id] || {}),
            ...(stock !== undefined ? { stock } : {}),
            ...(low_stock_threshold !== undefined ? { low_stock_threshold } : {}),
            ...(stock_unit !== undefined ? { stock_unit } : {}),
            ...(recipe !== undefined ? { recipe } : {}),
            ...(availability_status !== undefined ? { availability_status } : {})
          };
          localStorage.setItem('menu_items_local_overrides', JSON.stringify(overrides));
        }
      }

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

      if (!updatedItem) return null;
      
      const stockOverrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
      const localOverrides = JSON.parse(localStorage.getItem('menu_items_local_overrides') || '{}');
      const itemOverride = {
        ...(stockOverrides[id] || {}),
        ...(localOverrides[id] || {})
      };
      return {
        ...updatedItem,
        stock: (itemOverride.stock !== undefined && itemOverride.stock !== null) ? itemOverride.stock : updatedItem.stock,
        low_stock_threshold: itemOverride.low_stock_threshold !== undefined ? itemOverride.low_stock_threshold : updatedItem.low_stock_threshold,
        stock_unit: itemOverride.stock_unit !== undefined ? itemOverride.stock_unit : (updatedItem.stock_unit || 'pcs'),
        recipe: itemOverride.recipe !== undefined ? itemOverride.recipe : (updatedItem.recipe || []),
        availability_status: itemOverride.availability_status !== undefined ? itemOverride.availability_status : (updatedItem.availability_status || (updatedItem.is_available ? 'available' : 'out_of_stock'))
      };

    } catch (err) {
      console.warn('Fallback update for menu item:', err);
      const list = getMockData('menu_items');
      const updated = list.map(m => m.id === id ? { ...m, ...updates } : m);
      setMockData('menu_items', updated);
      
      const stockOverrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
      const localOverrides = JSON.parse(localStorage.getItem('menu_items_local_overrides') || '{}');
      let res = updated.find(m => m.id === id);
      if (res) {
        const itemOverride = {
          ...(stockOverrides[id] || {}),
          ...(localOverrides[id] || {})
        };
        res = {
          ...res,
          stock: itemOverride.stock !== undefined ? itemOverride.stock : res.stock,
          low_stock_threshold: itemOverride.low_stock_threshold !== undefined ? itemOverride.low_stock_threshold : res.low_stock_threshold,
          stock_unit: itemOverride.stock_unit !== undefined ? itemOverride.stock_unit : (res.stock_unit || 'pcs'),
          recipe: itemOverride.recipe !== undefined ? itemOverride.recipe : (res.recipe || []),
          availability_status: itemOverride.availability_status !== undefined ? itemOverride.availability_status : (res.availability_status || (res.is_available ? 'available' : 'out_of_stock'))
        };
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const deleteMenuItem = async (id) => {
    setLoading(true);
    setError(null);
    try {
      // Clean up local overrides
      const localOverrides = JSON.parse(localStorage.getItem('menu_items_local_overrides') || '{}');
      if (localOverrides[id]) {
        delete localOverrides[id];
        localStorage.setItem('menu_items_local_overrides', JSON.stringify(localOverrides));
      }
      const stockOverrides = JSON.parse(localStorage.getItem('menu_items_stock_overrides') || '{}');
      if (stockOverrides[id]) {
        delete stockOverrides[id];
        localStorage.setItem('menu_items_stock_overrides', JSON.stringify(stockOverrides));
      }

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
      
      const createdOrder = data[0];
      // Send mock realtime event even on success so local tabs sync immediately
      realtimeBroadcast.postMessage({
        eventType: 'INSERT',
        new: createdOrder,
        old: {}
      });
      
      return createdOrder;
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
      
      const updatedOrder = data[0];
      // Send mock realtime event even on success so local tabs sync immediately
      realtimeBroadcast.postMessage({
        eventType: 'UPDATE',
        new: updatedOrder,
        old: { id }
      });
      
      return updatedOrder;
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
      
      const updatedOrder = data[0];
      // Send mock realtime event even on success so local tabs sync immediately
      realtimeBroadcast.postMessage({
        eventType: 'UPDATE',
        new: updatedOrder,
        old: { id }
      });
      
      return updatedOrder;
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
      
      // Send mock realtime event even on success so local tabs sync immediately
      realtimeBroadcast.postMessage({
        eventType: 'DELETE',
        new: {},
        old: { id }
      });
      
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
    } catch {
      console.warn("Supabase Realtime not available. Using local BroadcastChannel instead.");
    }

    // Fallback broadcast channel listener for local tabs
    const handleBroadcastMessage = (e) => {
      const payload = e.data;
      if (cafeId && payload.new && String(payload.new.cafe_id) !== String(cafeId)) {
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

  const compressImage = (file, maxDimension = 1000, quality = 0.75) => {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name || 'image.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', quality);
        };
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
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

          // Compress to JPEG with 0.82 quality for high-fidelity offline previews
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
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
      let fileToUpload = file;
      if (file && file.type && file.type.startsWith('image/')) {
        // Compress to max 1600px dimension with 85% JPEG quality.
        // This keeps the image sharp for social media while still compressing 5MB down to ~150KB-200KB.
        fileToUpload = await compressImage(file, 1600, 0.85);
      }

      const fileExt = fileToUpload.name ? fileToUpload.name.split('.').pop() : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload);

      if (uploadErr) {
        console.warn('Supabase storage upload failed, falling back to base64 encoding with compression:', uploadErr.message);
        return compressAndConvertToBase64(fileToUpload);
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
    deleteStaff,
    validateActivationKey,
    fetchCafeByUsername,
    fetchCafeById,
    verifyRecoveryKey
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
