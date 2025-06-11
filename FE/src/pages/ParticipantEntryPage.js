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
      setError(err.response?.data?.message || '進入抽獎失敗。請再試一次。');
      console.error('Enter raffle error:', err);
    }
  };

  return (
    <div className="container">
      <h2>歡迎來到悠閒釣魚抽獎活動！</h2>
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleEnterRaffle} className="entry-form">
        <p>請輸入您的姓名和/或代幣以參與。</p>
        <div className="form-group">
          <label htmlFor="name">您的姓名 (選填):</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="輸入您的姓名"
          />
        </div>
        <div className="form-group">
          <label htmlFor="token">抽獎代幣 (公開活動選填):</label>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="輸入您的代幣"
          />
        </div>
        <button type="submit">進入抽獎</button>
      </form>
    </div>
  );
};

export default ParticipantEntryPage;
