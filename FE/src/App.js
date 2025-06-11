import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/items');
      setItems(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to fetch items. Please ensure the backend server is running.');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      setError('Item name cannot be empty.');
      return;
    }

    try {
      await axios.post('http://localhost:3001/api/items', {
        name: newItemName,
        description: newItemDescription,
      });
      setNewItemName('');
      setNewItemDescription('');
      fetchItems();
      setError(null);
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item. Please try again.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>ChillFishing App</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleAddItem}>
          <input
            type="text"
            placeholder="Item Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Item Description (optional)"
            value={newItemDescription}
            onChange={(e) => setNewItemDescription(e.target.value)}
          />
          <button type="submit">Add Item</button>
        </form>
        <h2>Items from Backend:</h2>
        {items.length === 0 ? (
          <p>No items found. Add some above!</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>: {item.description || 'No description'}
              </li>
            ))}
          </ul>
        )}
      </header>
    </div>
  );
}

export default App;
