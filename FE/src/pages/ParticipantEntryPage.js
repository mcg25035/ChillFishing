import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ParticipantEntryPage = () => {
  const [isPublicActivity, setIsPublicActivity] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivityStatus = async () => {
      try {
        const response = await api.get('/participant/activity-status');
        setIsPublicActivity(response.data.isPublic);
      } catch (err) {
        setError('Failed to fetch activity status.');
        console.error('Fetch activity status error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivityStatus();
  }, []);

  const handleEnterRaffle = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPublicActivity && !token.trim()) {
      setError('Please enter a token.');
      return;
    }

    try {
      const endpoint = isPublicActivity ? '/participant/enter-public' : '/participant/enter-private';
      const payload = isPublicActivity ? {} : { token };
      const response = await api.post(endpoint, payload);

      if (response.status === 200) {
        // Store participant ID if needed for future requests or display
        // For now, just navigate to raffle page
        navigate('/raffle');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enter raffle. Please try again.');
      console.error('Enter raffle error:', err);
    }
  };

  if (loading) {
    return <div className="container">Loading activity status...</div>;
  }

  return (
    <div className="container">
      <h2>Welcome to ChillFishing Raffle!</h2>
      {error && <p className="error-message">{error}</p>}

      {isPublicActivity ? (
        <div className="public-entry">
          <p>The raffle is currently public. Click below to enter!</p>
          <button onClick={handleEnterRaffle}>Enter Raffle</button>
        </div>
      ) : (
        <form onSubmit={handleEnterRaffle} className="private-entry">
          <p>The raffle is private. Please enter your token to participate.</p>
          <div className="form-group">
            <label htmlFor="token">Raffle Token:</label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
          <button type="submit">Enter Raffle</button>
        </form>
      )}
    </div>
  );
};

export default ParticipantEntryPage;
