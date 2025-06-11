import React, { useState, useEffect } from 'react';

const PrizeForm = ({ prize, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [probability, setProbability] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (prize) {
      setName(prize.name);
      setTotalQuantity(prize.totalQuantity);
      setProbability(prize.probability);
    } else {
      setName('');
      setTotalQuantity('');
      setProbability('');
    }
    setError('');
  }, [prize]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name || !totalQuantity || !probability) {
      setError('All fields are required.');
      return;
    }
    if (parseInt(totalQuantity) <= 0) {
      setError('Total quantity must be positive.');
      return;
    }
    if (parseFloat(probability) <= 0 || parseFloat(probability) > 1) {
      setError('Probability must be between 0 and 1 (exclusive of 0, inclusive of 1).');
      return;
    }

    onSubmit({
      id: prize ? prize.id : null,
      name,
      totalQuantity: parseInt(totalQuantity),
      probability: parseFloat(probability),
    });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{prize ? 'Edit Prize' : 'Add New Prize'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="prizeName">Name:</label>
            <input
              type="text"
              id="prizeName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="totalQuantity">Total Quantity:</label>
            <input
              type="number"
              id="totalQuantity"
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(e.target.value)}
              required
              min="1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="probability">Probability (0-1):</label>
            <input
              type="number"
              id="probability"
              step="0.01"
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              required
              min="0.01"
              max="1"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="submit">{prize ? 'Update Prize' : 'Add Prize'}</button>
            <button type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrizeForm;
