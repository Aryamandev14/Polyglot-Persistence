import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const API_BASE = 'http://localhost:3000';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [imageFile, setImageFile] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    const user = localStorage.getItem('user');
    if (user) {
      fetchProducts();
    } else {
      alert('Please login first!');
      navigate('/login');
    }
  }, [navigate]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !imageFile) {
      return alert('Please enter name, price, and select an image!');
    }

    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('price', newProduct.price);
    formData.append('image', imageFile);

    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const updated = await fetch(`${API_BASE}/products`);
        const data = await updated.json();
        setProducts(data);
        setNewProduct({ name: '', price: '' });
        setImageFile(null);
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Error adding product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleBuy = (productName) => {
    setSelectedProduct(productName);
    setShowModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!customerName) {
      alert('Please enter your name!');
      return;
    }

    const orderId = `order-${Date.now()}`;

    try {
      const res = await fetch(`${API_BASE}/graph/customers-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerName,
          order: orderId,
          product: selectedProduct,
        }),
      });

      if (res.ok) {
        alert(`Purchase successful! Linked ${selectedProduct} with ${customerName} in graph.`);
        setShowModal(false);
        setCustomerName('');
      } else {
        alert('Failed to record purchase in graph DB.');
      }
    } catch (error) {
      console.error('Error recording graph purchase:', error);
    }
  };

  return (
    <div style={styles.container}>
        <Navbar />
      <h1 style={styles.title}>🛍️ Polyglot Storefront</h1>

      {/* Add Product form */}
      <form onSubmit={handleAddProduct} style={styles.form} encType="multipart/form-data">
        <input
          type="text"
          placeholder="Product Name"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          style={styles.input}
          required
        />
        <input
          type="number"
          placeholder="Product Price"
          value={newProduct.price}
          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          style={styles.input}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>Add Product</button>
      </form>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products available</p>
      ) : (
        <div style={styles.productList}>
          {products.map((product) => (
            <div key={product._id} style={styles.productCard}>
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }}
                />
              )}
              <h3 style={styles.productName}>{product.name}</h3>
              <p style={styles.productPrice}>${product.price}</p>
              <button
                onClick={() => handleBuy(product.name)}
                style={styles.buyButton}
              >
                Buy
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal for customer name input */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>Please enter your name</h2>
            <input
              type="text"
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={styles.input}
            />
            <div style={styles.modalButtons}>
              <button onClick={handleConfirmPurchase} style={styles.button}>Confirm Purchase</button>
              <button onClick={() => setShowModal(false)} style={styles.button}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    background: '#f0f2f5',
  },
  title: {
    textAlign: 'center',
    fontSize: '2rem',
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  input: {
    flex: '1',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    minWidth: '180px',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  buyButton: {
    marginTop: '10px',
    backgroundColor: '#28a745',
    color: 'white',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  productList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  productCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '15px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  productName: {
    fontSize: '1.25rem',
    marginBottom: '10px',
    color: '#444',
  },
  productPrice: {
    fontSize: '1.125rem',
    color: '#007bff',
  },
  modalOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    textAlign: 'center',
    width: '300px',
  },
  modalButtons: {
    marginTop: '15px',
    display: 'flex',
    justifyContent: 'space-between',
  },
};
