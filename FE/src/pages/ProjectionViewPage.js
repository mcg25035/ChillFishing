import React, { useState, useEffect, useRef } from 'react';
import socket from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; // For initial login validation
import FishingAnimation from '../components/FishingAnimation'; // Import the new component

const ProjectionViewPage = () => {
  const [displayResult, setDisplayResult] = useState(null);
  const [secretText, setSecretText] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const fishingAnimationRef = useRef(null); // Ref for the FishingAnimation component

  const { secretIdentifyText, login } = useAuth();
  const navigate = useNavigate();

  // This useEffect will handle socket connection and event listeners
  useEffect(() => {
    socket.connect(); // Always connect socket when component mounts

    socket.on('raffleStarted', () => {
      fishingAnimationRef.current?.start(); // Trigger animations when raffle starts
    });

    socket.on('displayProjectionResult', (result) => {
      setDisplayResult({ ...result, animationClass: '' }); // Clear animation class initially
      // Prize float-up animation starts after 2 seconds
      setTimeout(() => {
        setDisplayResult((prev) => ({ ...prev, animationClass: 'float-up' }));
      }, 2000);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Real-time connection failed. Please refresh.');
    });

    return () => {
      socket.off('raffleStarted');
      socket.off('displayProjectionResult');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, []); // Empty dependency array to run once on mount and cleanup on unmount

  // Handle authentication state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setDisplayResult(null); // Clear result if unauthenticated
      fishingAnimationRef.current?.reset(); // Reset animations if unauthenticated
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/admin/login', { secret_identify_text: secretText });
      if (response.status === 200) {
        login(secretText); // Store the secret text in context and localStorage
        setIsAuthenticated(true); // Set authenticated state only after successful login
      }
    } catch (err) {
      setError('Invalid secret identify text for projection view.');
      console.error('Projection login error:', err);
    }
  };

  const handleNextRaffle = () => {
    if (!secretIdentifyText) {
      setError('Authentication required to advance raffle.');
      return;
    }
    // Emit nextRaffle event with authentication
    socket.emit('nextRaffle', { secret_identify_text: secretIdentifyText });
    setDisplayResult(null); // Clear current result
    setError('');
    fishingAnimationRef.current?.reset(); // Reset animations
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h2>投影頁面登入</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="secretText">祕密識別碼:</label>
            <input
              type="password"
              id="secretText"
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit">登入來投影抽獎活動</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container projection-view">
      <h2>悠閒釣魚抽獎活動</h2>
      {error && <p className="error-message">{error}</p>}

      <FishingAnimation ref={fishingAnimationRef} />

      {displayResult ? (
        <div className={`result-display ${displayResult.animationClass || ''}`}>
          {displayResult.type === 'prize' ? (
            <>
              <p className="projection-prize">中獎者: {displayResult.participant_id}</p>
              <p className="projection-prize">得到了 {displayResult.prize.name}</p>
            </>
          ) : (
            <p className="projection-consolation">{displayResult.message}</p>
          )}
          <button onClick={handleNextRaffle} className="next-raffle-button">開放下個抽獎</button>
        </div>
      ) : (
        <p className="waiting-message">正在等待下一位抽獎者按下抽獎...</p>
      )}
    </div>
  );
};

export default ProjectionViewPage;
