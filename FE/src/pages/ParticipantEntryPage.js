import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ParticipantEntryPage = () => {
  const [token, setToken] = useState('');
  const [name, setName] = useState(''); // New state for participant name
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEnterRaffle = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/participant/enter', { token, name }); // Send name along with token

      if (response.status === 200) {
        if (token) {
          sessionStorage.setItem('raffle_token', token);
        } else {
          sessionStorage.removeItem('raffle_token');
        }
        // Store the participant's name in sessionStorage
        if (name) {
          sessionStorage.setItem('participant_name', name);
        } else {
          sessionStorage.removeItem('participant_name'); // Clear name if not provided
        }
        navigate('/raffle');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enter raffle. Please try again.');
      console.error('Enter raffle error:', err);
    }
  };

  return (
    <div className="container">
      <h2>Welcome to ChillFishing Raffle!</h2>
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleEnterRaffle} className="entry-form">
        <p>Please enter your name and/or token to participate.</p>
        <div className="form-group">
          <label htmlFor="name">Your Name (optional):</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="token">Raffle Token (optional for public activity):</label>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your token"
          />
        </div>
        <button type="submit">Enter Raffle</button>
      </form>
    </div>
  );
};

export default ParticipantEntryPage;
