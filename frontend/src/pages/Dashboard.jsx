import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Package, FileText, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    lowStock: 0,
    challans: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [c, p, ch] = await Promise.all([
          axios.get('https://fundsroom.onrender.com/api/customers?limit=1'),
          axios.get('https://fundsroom.onrender.com/api/products?limit=1000'),
          axios.get('https://fundsroom.onrender.com/api/challans')
        ]);
        
        const productsData = p.data.data;
        const lowStockCount = productsData.filter(prod => prod.stock <= prod.minStockAlert).length;
        
        setStats({
          customers: c.data.total,
          products: p.data.total,
          lowStock: lowStockCount,
          challans: ch.data.length
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="page-title">Dashboard Overview</h1>
      
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#DBEAFE', color: '#1E40AF', borderRadius: '50%' }}>
            <Users size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Total Customers</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.customers}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '50%' }}>
            <Package size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Total Products</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.products}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', color: '#B45309', borderRadius: '50%' }}>
            <FileText size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Sales Challans</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.challans}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle color="var(--warning-color)" /> Low Stock Alerts
          </h2>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.lowStock > 0 ? 'var(--danger-color)' : 'var(--text-primary)', marginBottom: '1rem' }}>
            {stats.lowStock} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>products need restock</span>
          </div>
          <Link to="/products" className="btn btn-outline" style={{ display: 'inline-block', textDecoration: 'none' }}>View Inventory</Link>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/customers" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ Add New Customer</Link>
            <Link to="/challans" className="btn btn-outline" style={{ textDecoration: 'none' }}>+ Create Sales Challan</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
