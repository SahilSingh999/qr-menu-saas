import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminPanel from './components/AdminPanel';
import WaiterDashboard from './components/WaiterDashboard';
import CustomerView from './components/CustomerView';

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
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/waiter" element={<WaiterDashboard />} />
          <Route path="/table/:tableId" element={<CustomerView />} />
          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
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
