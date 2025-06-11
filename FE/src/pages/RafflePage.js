import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import socket from '../utils/socket';

const RafflePage = () => {
  const [raffleLocked, setRaffleLocked] = useState(true); // Assume locked initially, rely on socket for unlock
  const [raffleResult, setRaffleResult] = useState(null);
  const [error, setError] = useState('');

  // No initial fetch for raffle status, rely solely on Socket.IO events
  useEffect(() => {
    socket.connect();

    socket.on('raffleLocked', (isLocked) => {
      setRaffleLocked(isLocked);
      if (isLocked) {
        setRaffleResult(null); // Clear previous result when locked
      }
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
  }, []); // Empty dependency array as no external dependencies

  const handleDrawRaffle = async () => {
    setError('');
    setRaffleResult(null);
    try {
      // Backend /raffle endpoint expects participant_id and optionally token
      // For simplicity, we'll assume participant_id is handled by backend session or not strictly required for public
      // If private, the token would have been used at entry, so we don't need to send it again here for the draw.
      // However, the backend's /raffle endpoint *does* expect participant_id.
      const raffleToken = sessionStorage.getItem('raffle_token');
      // Backend /raffle endpoint expects participant_id and optionally token
      const participantName = sessionStorage.getItem('participant_name'); // Get participant name from sessionStorage
      const response = await api.post('/participant/raffle', {
        name: participantName, // Send participant name
        token: raffleToken, // Send token if available
      });
      setRaffleResult(response.data.result); // Backend returns { success: true, result: ... }
      setRaffleLocked(true); // Lock after drawing
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to draw raffle. Please try again.');
      console.error('Draw raffle error:', err);
    }
  };

  // No loading state based on API fetch, only socket connection

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
