import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: '50%', color: 'var(--primary-color)', marginBottom: '1rem' }}>
            <LogIn size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue</p>
        </div>

        {error && <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>QUICK-FILL TEST ROLES</span>
          </div>
          <div className="grid-2">
            <button 
              className="btn btn-outline" 
              onClick={() => { setUsername('admin'); setPassword('password'); }}
              style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
              Admin
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => { setUsername('sales'); setPassword('password'); }}
              style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
              Sales
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => { setUsername('warehouse'); setPassword('password'); }}
              style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
              Warehouse
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => { setUsername('accounts'); setPassword('password'); }}
              style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
              Accounts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
