import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function App() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/items`);
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err.message || 'Failed to fetch items. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const response = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!response.ok) throw new Error('Failed to create item');
      const newItem = await response.json();
      setItems([newItem, ...items]);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Error creating item:', err);
      setError(err.message || 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>3-Tier Application</h1>
        <p>API: {API_BASE}</p>
      </header>
      <main className="App-main">
        <section className="add-item-section">
          <h2>Add New Item</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                placeholder="Enter item title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Enter item description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Item'}
            </button>
          </form>
        </section>
        <section className="items-section">
          <h2>Items List</h2>
          {loading && <div className="loading">Loading items...</div>}
          {!loading && !error && items.length === 0 && (
            <div className="no-items">No items yet. Create one above!</div>
          )}
          {!loading && !error && items.length > 0 && (
            <ul className="items-list">
              {items.map((item) => (
                <li key={item.id} className="item">
                  <div className="item-header">
                    <h3>{item.title}</h3>
                    <span className="item-date">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <footer className="App-footer">
        <p>Backend: <code>{API_BASE}</code></p>
      </footer>
    </div>
  );
}

export default App;
