import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, LogOut } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <Outlet />; // For login page
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '250px', backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>
          CRM & Inventory
        </div>
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          <Link to="/" style={navStyle}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/customers" style={navStyle}>
            <Users size={20} /> Customers
          </Link>
          <Link to="/products" style={navStyle}>
            <Package size={20} /> Inventory
          </Link>
          <Link to="/challans" style={navStyle}>
            <FileText size={20} /> Sales Challans
          </Link>
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid #374151' }}>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
            Logged in as <strong>{user.username}</strong> ({user.role})
          </div>
          <button onClick={handleLogout} className="btn" style={{ width: '100%', backgroundColor: '#374151', color: 'white' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

const navStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.75rem 1.5rem',
  color: 'var(--sidebar-text)',
  textDecoration: 'none',
  gap: '0.75rem',
  transition: 'var(--transition)'
};

export default Layout;
