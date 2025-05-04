import React, { useState } from 'react';

export default function AddGraphEntry() {
  const [formData, setFormData] = useState({
    customer: '',
    order: '',
    product: '',
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');

    try {
      const res = await fetch('http://localhost:3000/graph/customers-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('✅ Entry added to graph!');
        setFormData({ customer: '', order: '', product: '' });
      } else {
        const err = await res.json();
        setStatus(`❌ Error: ${err.error || 'Failed to add entry'}`);
      }
    } catch (err) {
      setStatus(`❌ Network error`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>➕ Add to Customer-Order Graph</h2>
      <form onSubmit={handleSubmit}>
        <input name="customer" placeholder="Customer Name" value={formData.customer} onChange={handleChange} required />
        <input name="order" placeholder="Order ID" value={formData.order} onChange={handleChange} required />
        <input name="product" placeholder="Product Name" value={formData.product} onChange={handleChange} required />
        <button type="submit">Add Entry</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
