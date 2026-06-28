import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { fetchCafes } = useSupabase();
  const { isDark, toggleTheme } = useTheme();
  const [firstCafeId, setFirstCafeId] = useState('1');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadFirstCafe = async () => {
      try {
        const cafes = await fetchCafes();
        if (cafes && cafes.length > 0) {
          setFirstCafeId(cafes[0].id);
        }
      } catch (e) {
        console.error('Error fetching cafes for navbar:', e);
      }
    };
    loadFirstCafe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname.startsWith('/table/')) return null;

  return (
    <nav className="debug-navbar">
      <div className="nav-inner">
        <div className="nav-logo">
          <span className="logo-spark">✨</span>
          <strong>QR SaaS Console</strong>
        </div>

        {/* Mobile hamburger button */}
        <button 
          className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <div 
          className={`mobile-backdrop ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        <div className={`nav-right ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="nav-links">
            <NavLink 
              to="/admin" 
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              🔑 Admin
            </NavLink>
            <NavLink 
              to="/waiter" 
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              👨‍🍳 Waiter
            </NavLink>
            <NavLink 
              to={`/table/4?cafe=${firstCafeId}`} 
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              📱 Customer
            </NavLink>
          </div>

          {/* Theme Toggle Switch */}
          <button 
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="toggle-icon">{isDark ? '🌙' : '☀️'}</span>
            <span className="toggle-label">{isDark ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
