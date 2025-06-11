import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import socket from '../utils/socket';

const RafflePage = () => {
  const [raffleLocked, setRaffleLocked] = useState(true);
  const [raffleResult, setRaffleResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRaffleStatus = useCallback(async () => {
    try {
      const response = await api.get('/participant/raffle-status');
      setRaffleLocked(response.data.isLocked);
    } catch (err) {
      setError('Failed to fetch raffle status.');
      console.error('Fetch raffle status error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRaffleStatus();

    socket.connect();

    socket.on('raffleLocked', () => {
      setRaffleLocked(true);
      setRaffleResult(null); // Clear previous result when locked
    });

    socket.on('raffleUnlocked', () => {
      setRaffleLocked(false);
    });

    socket.on('raffleResult', (result) => {
      setRaffleResult(result);
      setRaffleLocked(true); // Lock after a result is displayed
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Real-time connection failed. Please refresh.');
    });

    return () => {
      socket.off('raffleLocked');
      socket.off('raffleUnlocked');
      socket.off('raffleResult');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [fetchRaffleStatus]);

  const handleDrawRaffle = async () => {
    setError('');
    setRaffleResult(null);
    try {
      const response = await api.post('/participant/draw');
      setRaffleResult(response.data);
      setRaffleLocked(true); // Lock after drawing
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to draw raffle. Please try again.');
      console.error('Draw raffle error:', err);
    }
  };

  if (loading) {
    return <div className="container">Loading raffle status...</div>;
  }

  return (
    <div className="container raffle-page">
      <h2>ChillFishing Raffle</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="raffle-status">
        {raffleLocked ? (
          <p className="locked-message">Please wait for the next draw.</p>
        ) : (
          <button onClick={handleDrawRaffle} disabled={raffleLocked}>
            Draw!
          </button>
        )}
      </div>

      {raffleResult && (
        <div className="raffle-result">
          <h3>Raffle Result:</h3>
          {raffleResult.type === 'prize' ? (
            <p className="prize-won">Congratulations! You won a {raffleResult.prize.name}!</p>
          ) : (
            <p className="consolation-message">{raffleResult.message}</p>
          )}
          {/* Optional: Add simple animation here */}
        </div>
      )}
    </div>
  );
};

export default RafflePage;
