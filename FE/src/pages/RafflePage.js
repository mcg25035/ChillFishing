import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import socket from '../utils/socket';
import FishingAnimation from '../components/FishingAnimation'; // Import the new component

const RafflePage = () => {
  const [raffleLocked, setRaffleLocked] = useState(true); // Assume locked initially, rely on socket for unlock
  const [raffleResult, setRaffleResult] = useState(null);
  const [error, setError] = useState('');

  const fishingAnimationRef = useRef(null); // Ref for the FishingAnimation component

  // No initial fetch for raffle status, rely solely on Socket.IO events
  useEffect(() => {
    socket.connect();

    socket.on('raffleLocked', (isLocked) => {
      setRaffleLocked(isLocked);
      if (isLocked) {
        setRaffleResult(null); // Clear previous result when locked
        fishingAnimationRef.current?.reset(); // Reset animations
      }
    });

    socket.on('raffleUnlocked', () => {
      setRaffleLocked(false);
      fishingAnimationRef.current?.reset(); // Ensure idle when unlocked
    });

    socket.on('raffleResult', (result) => {
      setRaffleResult({ ...result, animationClass: '' }); // Clear animation class initially
      setRaffleLocked(true); // Lock after a result is displayed
      // Prize float-up animation starts after 2 seconds
      setTimeout(() => {
        setRaffleResult((prev) => ({ ...prev, animationClass: 'float-up' }));
      }, 2000);
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
    setRaffleResult(null); // Clear previous result before new draw
    fishingAnimationRef.current?.start(); // Trigger animations

    try {
      const raffleToken = sessionStorage.getItem('raffle_token');
      const participantName = sessionStorage.getItem('participant_name');
      const response = await api.post('/participant/raffle', {
        name: participantName,
        token: raffleToken,
      });
      // The actual result will be set by the 'raffleResult' socket event
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to draw raffle. Please try again.');
      console.error('Draw raffle error:', err);
      fishingAnimationRef.current?.reset(); // Reset all animations on error
    }
  };

  const handleAnimationComplete = () => {
    // This callback can be used if RafflePage needs to do something after animation completes
    // For now, it's not strictly necessary as prize display is handled by socket event
  };

  return (
    <div className="container raffle-page">
      <h2>悠閒釣魚抽獎</h2>
      {error && <p className="error-message">{error}</p>}

      <FishingAnimation ref={fishingAnimationRef} onAnimationComplete={handleAnimationComplete} />

      <div className="raffle-status">
        {raffleLocked ? (
          <p className="locked-message">請等待主持人開放下個抽獎</p>
        ) : (
          <button onClick={handleDrawRaffle} disabled={raffleLocked}>
            抽獎!
          </button>
        )}
      </div>

      {raffleResult && (
        <div className={`raffle-result ${raffleResult.animationClass || ''}`}>
          <h3>結果:</h3>
          {raffleResult.type === 'prize' ? (
            <p className="prize-won">恭喜，你獲得了 {raffleResult.prize.name}!</p>
          ) : (
            <p className="consolation-message">{raffleResult.message}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RafflePage;
