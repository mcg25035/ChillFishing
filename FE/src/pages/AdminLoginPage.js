import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AdminLoginPage = () => {
  const [secretText, setSecretText] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/admin/login', { secret_identify_text: secretText });
      if (response.status === 200) {
        login(secretText); // Store the secret text in context and localStorage
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError('Invalid secret identify text.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="container">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
