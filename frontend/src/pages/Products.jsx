import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, ArrowRightLeft, Trash2 } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/products?search=${search}`);
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.unitPrice = parseFloat(data.unitPrice);
    data.minStockAlert = parseInt(data.minStockAlert, 10);
    
    try {
      if (currentProduct) {
        await axios.put(`http://localhost:5000/api/products/${currentProduct.id}`, data);
      } else {
        await axios.post('http://localhost:5000/api/products', data);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleStockMovement = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      productId: currentProduct.id,
      type: formData.get('type'),
      quantity: parseInt(formData.get('quantity'), 10),
      reason: formData.get('reason')
    };

    try {
      await axios.post('http://localhost:5000/api/inventory/movement', data);
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update stock');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product? All related stock movements will also be deleted.')) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error(err);
        alert('Failed to delete product');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Inventory Management</h1>
        <button className="btn btn-primary" onClick={() => { setCurrentProduct(null); setIsModalOpen(true); }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by product name or SKU..." 
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Info</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Level</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: '500' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {p.sku}</div>
                </td>
                <td>{p.category || '-'}</td>
                <td>₹{p.unitPrice.toFixed(2)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: p.stock <= p.minStockAlert ? 'var(--danger-color)' : 'var(--success-color)' }}>
                      {p.stock}
                    </span>
                    {p.stock <= p.minStockAlert && (
                      <span className="badge badge-danger" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Low Stock</span>
                    )}
                  </div>
                </td>
                <td>{p.location || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => { setCurrentProduct(p); setIsModalOpen(true); }} title="Edit Product">
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => { setCurrentProduct(p); setIsStockModalOpen(true); }} title="Update Stock">
                      <ArrowRightLeft size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.25rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={() => handleDelete(p.id)} title="Delete Product">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{currentProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSaveProduct}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input type="text" name="name" className="form-input" defaultValue={currentProduct?.name} required />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU/Code *</label>
                  <input type="text" name="sku" className="form-input" defaultValue={currentProduct?.sku} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input type="text" name="category" className="form-input" defaultValue={currentProduct?.category} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (₹) *</label>
                  <input type="number" step="0.01" name="unitPrice" className="form-input" defaultValue={currentProduct?.unitPrice} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Stock Alert *</label>
                  <input type="number" name="minStockAlert" className="form-input" defaultValue={currentProduct?.minStockAlert || 5} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Location/Warehouse</label>
                  <input type="text" name="location" className="form-input" defaultValue={currentProduct?.location} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {isStockModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Update Stock: {currentProduct?.name}</h2>
            <form onSubmit={handleStockMovement}>
              <div className="form-group">
                <label className="form-label">Movement Type *</label>
                <select name="type" className="form-input" required>
                  <option value="IN">Stock IN (+)</option>
                  <option value="OUT">Stock OUT (-)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input type="number" min="1" name="quantity" className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Reason / Notes</label>
                <input type="text" name="reason" className="form-input" placeholder="e.g., Restock, Damaged, Sample" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsStockModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
