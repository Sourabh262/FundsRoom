import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Eye, CheckCircle } from 'lucide-react';

const Challans = () => {
  const [challans, setChallans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState([]); // [{ productId, quantity, maxStock, name }]

  useEffect(() => {
    fetchChallans();
  }, []);

  const fetchChallans = async () => {
    try {
      const res = await axios.get('https://fundsroom.onrender.com/api/challans');
      setChallans(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        axios.get('https://fundsroom.onrender.com/api/customers?limit=100'),
        axios.get('https://fundsroom.onrender.com/api/products?limit=100')
      ]);
      setCustomers(custRes.data.data.filter(c => c.status !== 'Inactive'));
      setProducts(prodRes.data.data.filter(p => p.stock > 0));
      setItems([]);
      setSelectedCustomer('');
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load data for new challan');
    }
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, maxStock: 0, name: '' }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'productId') {
      const p = products.find(p => p.id === parseInt(value));
      newItems[index] = { ...newItems[index], productId: value, maxStock: p?.stock || 0, name: p?.name || '' };
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveChallan = async (status) => {
    if (!selectedCustomer) return alert('Select a customer');
    if (items.length === 0) return alert('Add at least one product');
    
    // Validation
    for (const item of items) {
      if (!item.productId) return alert('Select a product for all rows');
      if (item.quantity <= 0) return alert('Quantity must be at least 1');
      if (status === 'Confirmed' && item.quantity > item.maxStock) {
        return alert(`Insufficient stock for ${item.name}. Max available: ${item.maxStock}`);
      }
    }

    try {
      await axios.post('https://fundsroom.onrender.com/api/challans', {
        customerId: parseInt(selectedCustomer),
        status,
        items: items.map(i => ({ productId: parseInt(i.productId), quantity: parseInt(i.quantity) }))
      });
      setIsModalOpen(false);
      fetchChallans();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create challan');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Sales Challans</h1>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={16} /> New Challan
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Challan #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total Items</th>
              <th>Status</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {challans.map(ch => (
              <tr key={ch.id}>
                <td><strong style={{ color: 'var(--primary-color)' }}>{ch.challanNumber}</strong></td>
                <td>{new Date(ch.createdAt).toLocaleDateString()}</td>
                <td>
                  <div>{ch.customer?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ch.customer?.mobile}</div>
                </td>
                <td>{ch.totalQuantity}</td>
                <td>
                  <span className={`badge badge-${ch.status.toLowerCase()}`}>{ch.status}</span>
                </td>
                <td>{ch.createdBy}</td>
              </tr>
            ))}
            {challans.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No challans generated yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create Sales Challan</h2>
            
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select className="form-input" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                <option value="">Select Customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                ))}
              </select>
            </div>

            <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Products</h3>
                <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={addItem}>
                  + Add Item
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Product</label>
                    <select className="form-input" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                      <option value="">Select Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '100px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Quantity</label>
                    <input type="number" min="1" className="form-input" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                  </div>
                  <button type="button" className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => removeItem(index)}>X</button>
                </div>
              ))}
              {items.length === 0 && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No items added yet.</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-outline" onClick={() => handleSaveChallan('Draft')}>Save as Draft</button>
              <button type="button" className="btn btn-primary" onClick={() => handleSaveChallan('Confirmed')}>
                <CheckCircle size={16} /> Confirm Challan
              </button>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
              Note: Confirming the challan will permanently reduce product stock.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challans;
