import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

// Lazy-load route components for code-splitting and faster mobile page loads
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const WaiterDashboard = lazy(() => import('./components/WaiterDashboard'));
const CustomerView = lazy(() => import('./components/CustomerView'));

// Loading Fallback Component
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px',
      color: 'var(--text-muted)'
    }}>
      <div style={{
        width: '42px',
        height: '42px',
        border: '3.5px solid rgba(0, 242, 254, 0.15)',
        borderTopColor: 'var(--accent-cyan)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.5px' }}>Loading workspace...</span>
    </div>
  );
}

function AppRoutes() {
  const { pathname } = useLocation();
  const isCustomer = pathname.startsWith('/table/');

  return (
    <div className={isCustomer ? 'customer-page-root' : 'app-container'}>
      {/* Background Decor — only for admin/waiter views */}
      {!isCustomer && (
        <>
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </>
      )}

      {/* Global Navigation Header */}
      <Navbar />

      {/* Routing Workspace */}
      <div className={isCustomer ? '' : 'routing-workspace'}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Cafe Owner admin panel — only shows owner login */}
            <Route path="/admin" element={<AdminPanel mode="owner" key="owner" />} />
            {/* Super Admin console — hidden URL, shows super admin login only */}
            <Route path="/superadmin" element={<AdminPanel mode="superadmin" key="superadmin" />} />
            <Route path="/waiter" element={<WaiterDashboard />} />
            <Route path="/table/:tableId" element={<CustomerView />} />
            {/* Fallback Redirection */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
