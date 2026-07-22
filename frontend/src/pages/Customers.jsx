import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Eye, MessageSquare, Trash2 } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`https://fundsroom.onrender.com/api/customers?search=${search}`);
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleOpenModal = (customer = null) => {
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setCurrentCustomer(null);
    setIsModalOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (currentCustomer) {
        await axios.put(`https://fundsroom.onrender.com/api/customers/${currentCustomer.id}`, data);
      } else {
        await axios.post('https://fundsroom.onrender.com/api/customers', data);
      }
      handleCloseModal();
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert('Failed to save customer');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer? All related challans will also be deleted.')) {
      try {
        await axios.delete(`https://fundsroom.onrender.com/api/customers/${id}`);
        fetchCustomers();
      } catch (err) {
        console.error(err);
        alert('Failed to delete customer');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Customer Management</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name, mobile, email..." 
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: '500' }}>{c.name}</div>
                  {c.businessName && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.businessName}</div>}
                </td>
                <td>
                  <div>{c.mobile}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.email}</div>
                </td>
                <td>{c.type}</td>
                <td>
                  <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => handleOpenModal(c)}>
                      <Edit size={16} />
                    </button>
                    {/* View details feature placeholder */}
                    <button className="btn btn-outline" style={{ padding: '0.25rem' }} title="View Details">
                      <Eye size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.25rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={() => handleDelete(c.id)} title="Delete Customer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{currentCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" name="name" className="form-input" defaultValue={currentCustomer?.name} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input type="text" name="mobile" className="form-input" defaultValue={currentCustomer?.mobile} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-input" defaultValue={currentCustomer?.email} />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input type="text" name="businessName" className="form-input" defaultValue={currentCustomer?.businessName} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input type="text" name="gstNumber" className="form-input" defaultValue={currentCustomer?.gstNumber} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type *</label>
                  <select name="type" className="form-input" defaultValue={currentCustomer?.type || 'Retail'} required>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select name="status" className="form-input" defaultValue={currentCustomer?.status || 'Lead'} required>
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input type="date" name="followUpDate" className="form-input" defaultValue={currentCustomer?.followUpDate?.split('T')[0]} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea name="address" className="form-input" rows="2" defaultValue={currentCustomer?.address}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea name="notes" className="form-input" rows="3" defaultValue={currentCustomer?.notes}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
