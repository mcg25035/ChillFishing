import React, { useState, useEffect, useCallback } from 'react';
import socket from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; // For initial login validation

const ProjectionViewPage = () => {
  const [displayResult, setDisplayResult] = useState(null);
  const [secretText, setSecretText] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const { secretIdentifyText, login } = useAuth();
  const navigate = useNavigate();

  // This useEffect will handle socket connection based on isAuthenticated state
  useEffect(() => {
    if (!isAuthenticated) {
      socket.disconnect(); // Ensure disconnected if not authenticated
      return;
    }
    socket.connect(); // Connect socket only if authenticated

    socket.on('displayProjectionResult', (result) => {
      setDisplayResult(result);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Real-time connection failed. Please refresh.');
    });

    return () => {
      socket.off('displayProjectionResult');
      socket.off('connect_error');
      socket.disconnect();
    };
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
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h2>Projection View Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="secretText">Secret Identify Text:</label>
            <input
              type="password"
              id="secretText"
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit">Login for Projection</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container projection-view">
      <h2>ChillFishing Raffle Projection</h2>
      {error && <p className="error-message">{error}</p>}

      {displayResult ? (
        <div className="result-display">
          {displayResult.type === 'prize' ? (
            <>
              <p className="projection-prize">Winner: {displayResult.participant_id}</p> {/* Display participant_id */}
              <p className="projection-prize">Won: {displayResult.prize.name}</p>
            </>
          ) : (
            <p className="projection-consolation">{displayResult.message}</p>
          )}
          <button onClick={handleNextRaffle} className="next-raffle-button">Next Raffle</button>
        </div>
      ) : (
        <p className="waiting-message">Waiting for next raffle result...</p>
      )}
    </div>
  );
};

export default ProjectionViewPage;
