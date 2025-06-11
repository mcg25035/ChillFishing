import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PrizeForm from '../components/PrizeForm';
import ConsolationMessageForm from '../components/ConsolationMessageForm';

const AdminDashboard = () => {
  const { secretIdentifyText, logout } = useAuth();
  const navigate = useNavigate();

  const [prizes, setPrizes] = useState([]);
  const [consolationMessages, setConsolationMessages] = useState([]);
  const [activityStatus, setActivityStatus] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [numTokensToGenerate, setNumTokensToGenerate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [currentPrize, setCurrentPrize] = useState(null);

  const [showConsolationModal, setShowConsolationModal] = useState(false);
  const [currentConsolationMessage, setCurrentConsolationMessage] = useState(null);

  const fetchPrizes = useCallback(async () => {
    try {
      const response = await api.get('/admin/prizes');
      setPrizes(response.data);
    } catch (err) {
      setError('Failed to fetch prizes.');
      console.error('Fetch prizes error:', err);
    }
  }, []);

  const fetchConsolationMessages = useCallback(async () => {
    try {
      const response = await api.get('/admin/consolation-messages');
      setConsolationMessages(response.data);
    } catch (err) {
      setError('Failed to fetch consolation messages.');
      console.error('Fetch consolation messages error:', err);
    }
  }, []);

  const fetchActivityStatus = useCallback(async () => {
    try {
      const response = await api.get('/admin/activity-status');
      setActivityStatus(response.data.isPublic);
    } catch (err) {
      setError('Failed to fetch activity status.');
      console.error('Fetch activity status error:', err);
    }
  }, []);

  const fetchTokens = useCallback(async () => {
    try {
      const response = await api.get('/admin/tokens');
      setTokens(response.data);
    } catch (err) {
      setError('Failed to fetch tokens.');
      console.error('Fetch tokens error:', err);
    }
  }, []);

  useEffect(() => {
    if (!secretIdentifyText) {
      navigate('/admin/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError('');
      await Promise.all([
        fetchPrizes(),
        fetchConsolationMessages(),
        fetchActivityStatus(),
        fetchTokens(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [secretIdentifyText, navigate, fetchPrizes, fetchConsolationMessages, fetchActivityStatus, fetchTokens]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const showNotification = (message, type) => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
  };

  const handleToggleActivityStatus = async () => {
    try {
      const newStatus = !activityStatus;
      await api.post('/admin/activity-status', { isPublic: newStatus });
      setActivityStatus(newStatus);
      showNotification(`Activity set to ${newStatus ? 'public' : 'private'} successfully.`, 'success');
    } catch (err) {
      showNotification('Failed to update activity status.', 'error');
      console.error('Update activity status error:', err);
    }
  };

  const handleGenerateTokens = async (e) => {
    e.preventDefault();
    if (numTokensToGenerate <= 0) {
      showNotification('Number of tokens must be positive.', 'error');
      return;
    }
    try {
      await api.post('/admin/generate-tokens', { count: numTokensToGenerate });
      showNotification(`${numTokensToGenerate} tokens generated successfully.`, 'success');
      fetchTokens(); // Refresh token list
    } catch (err) {
      showNotification('Failed to generate tokens.', 'error');
      console.error('Generate tokens error:', err);
    }
  };

  // Prize CRUD operations
  const handleAddPrize = () => {
    setCurrentPrize(null);
    setShowPrizeModal(true);
  };

  const handleEditPrize = (prize) => {
    setCurrentPrize(prize);
    setShowPrizeModal(true);
  };

  const handleDeletePrize = async (prizeId) => {
    if (!window.confirm('Are you sure you want to delete this prize?')) {
      return;
    }
    try {
      await api.delete(`/admin/prizes/${prizeId}`);
      showNotification('Prize deleted successfully.', 'success');
      fetchPrizes();
    } catch (err) {
      showNotification('Failed to delete prize.', 'error');
      console.error('Delete prize error:', err);
    }
  };

  const handlePrizeSubmit = async (prizeData) => {
    try {
      if (prizeData.id) {
        await api.put(`/admin/prizes/${prizeData.id}`, prizeData);
        showNotification('Prize updated successfully.', 'success');
      } else {
        await api.post('/admin/prizes', prizeData);
        showNotification('Prize added successfully.', 'success');
      }
      setShowPrizeModal(false);
      fetchPrizes();
    } catch (err) {
      showNotification('Failed to save prize.', 'error');
      console.error('Save prize error:', err);
    }
  };

  // Consolation Message CRUD operations
  const handleAddConsolationMessage = () => {
    setCurrentConsolationMessage(null);
    setShowConsolationModal(true);
  };

  const handleEditConsolationMessage = (message) => {
    setCurrentConsolationMessage(message);
    setShowConsolationModal(true);
  };

  const handleDeleteConsolationMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    try {
      await api.delete(`/admin/consolation-messages/${messageId}`);
      showNotification('Consolation message deleted successfully.', 'success');
      fetchConsolationMessages();
    } catch (err) {
      showNotification('Failed to delete consolation message.', 'error');
      console.error('Delete consolation message error:', err);
    }
  };

  const handleConsolationMessageSubmit = async (messageData) => {
    try {
      if (messageData.id) {
        await api.put(`/admin/consolation-messages/${messageData.id}`, messageData);
        showNotification('Consolation message updated successfully.', 'success');
      } else {
        await api.post('/admin/consolation-messages', messageData);
        showNotification('Consolation message added successfully.', 'success');
      }
      setShowConsolationModal(false);
      fetchConsolationMessages();
    } catch (err) {
      showNotification('Failed to save consolation message.', 'error');
      console.error('Save consolation message error:', err);
    }
  };

  if (loading) {
    return <div className="container">Loading admin dashboard...</div>;
  }

  return (
    <div className="container admin-dashboard">
      <h2>Admin Dashboard</h2>
      <button onClick={handleLogout} className="logout-button">Logout</button>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* Prize Management Section */}
      <section className="section">
        <h3>Prize Management</h3>
        <button onClick={handleAddPrize}>Add New Prize</button>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Total Quantity</th>
              <th>Remaining</th>
              <th>Probability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prizes.map((prize) => (
              <tr key={prize.id}>
                <td>{prize.name}</td>
                <td>{prize.totalQuantity}</td>
                <td>{prize.remainingQuantity}</td>
                <td>{prize.probability}</td>
                <td>
                  <button onClick={() => handleEditPrize(prize)}>Edit</button>
                  <button onClick={() => handleDeletePrize(prize.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showPrizeModal && (
          <PrizeForm
            prize={currentPrize}
            onSubmit={handlePrizeSubmit}
            onCancel={() => setShowPrizeModal(false)}
          />
        )}
      </section>

      {/* Consolation Message Management Section */}
      <section className="section">
        <h3>Consolation Message Management</h3>
        <button onClick={handleAddConsolationMessage}>Add New Message</button>
        <ul>
          {consolationMessages.map((msg) => (
            <li key={msg.id}>
              {msg.message}
              <div>
                <button onClick={() => handleEditConsolationMessage(msg)}>Edit</button>
                <button onClick={() => handleDeleteConsolationMessage(msg.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        {showConsolationModal && (
          <ConsolationMessageForm
            message={currentConsolationMessage}
            onSubmit={handleConsolationMessageSubmit}
            onCancel={() => setShowConsolationModal(false)}
          />
        )}
      </section>

      {/* Activity Settings Section */}
      <section className="section">
        <h3>Activity Settings</h3>
        <div className="form-group">
          <label>
            Activity Status: {activityStatus ? 'Public (Unlimited Attempts)' : 'Private (Token Based)'}
            <input
              type="checkbox"
              checked={activityStatus}
              onChange={handleToggleActivityStatus}
            />
          </label>
        </div>

        {!activityStatus && (
          <div className="token-management">
            <h4>Token Management</h4>
            <form onSubmit={handleGenerateTokens}>
              <div className="form-group">
                <label htmlFor="numTokens">Number of Tokens to Generate:</label>
                <input
                  type="number"
                  id="numTokens"
                  value={numTokensToGenerate}
                  onChange={(e) => setNumTokensToGenerate(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                />
              </div>
              <button type="submit">Generate Tokens</button>
            </form>

            <h4>Existing Tokens</h4>
            <ul>
              {tokens.map((token) => (
                <li key={token.id}>
                  {token.token} - {token.used ? 'Used' : 'Unused'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
