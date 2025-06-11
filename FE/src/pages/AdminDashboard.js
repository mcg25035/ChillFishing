import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import socket from '../utils/socket'; // Import socket
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
      console.log('Fetched prizes:', response.data); // Add console log
    } catch (err) {
      setError('無法獲取獎品。');
      console.error('Fetch prizes error:', err);
    }
  }, []);

  const fetchConsolationMessages = useCallback(async () => {
    try {
      const response = await api.get('/admin/consolation-messages');
      setConsolationMessages(response.data);
    } catch (err) {
      setError('無法獲取安慰獎訊息。');
      console.error('Fetch consolation messages error:', err);
    }
  }, []);

  const fetchActivityStatus = useCallback(async () => {
    try {
      const response = await api.get('/admin/settings/public');
      setActivityStatus(response.data.is_public); // Backend returns is_public
    } catch (err) {
      setError('無法獲取活動狀態。');
      console.error('Fetch activity status error:', err);
    }
  }, []);

  const fetchTokens = useCallback(async () => {
    try {
      const response = await api.get('/admin/tokens');
      setTokens(response.data);
      console.log('Fetched tokens:', response.data); // Add console log
    } catch (err) {
      setError('無法獲取代幣。');
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

    // Socket.IO for real-time updates
    socket.connect();
    socket.on('prizesUpdated', (updatedPrizes) => {
      setPrizes(updatedPrizes);
      showNotification('獎品已即時更新。', 'success');
    });

    socket.on('tokensUpdated', (updatedTokens) => {
      setTokens(updatedTokens);
      showNotification('代幣已即時更新。', 'success');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error in AdminDashboard:', err);
      setError('即時連線失敗。請重新整理。');
    });

    return () => {
      socket.off('prizesUpdated');
      socket.off('connect_error');
      socket.disconnect();
    };
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
      await api.post('/admin/settings/public', { is_public: newStatus });
      setActivityStatus(newStatus);
      showNotification(`活動已成功設定為${newStatus ? '公開' : '私人'}。`, 'success');
    } catch (err) {
      showNotification('更新活動狀態失敗。', 'error');
      console.error('Update activity status error:', err);
    }
  };

  const handleGenerateTokens = async (e) => {
    e.preventDefault();
    if (numTokensToGenerate <= 0) {
      showNotification('代幣數量必須為正數。', 'error');
      return;
    }
    try {
      await api.post('/admin/tokens/generate', { count: numTokensToGenerate });
      showNotification(`${numTokensToGenerate} 個代幣已成功生成。`, 'success');
      fetchTokens(); // Refresh token list
    } catch (err) {
      showNotification('生成代幣失敗。', 'error');
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
    if (!window.confirm('您確定要刪除此獎品嗎？')) {
      return;
    }
    try {
      await api.delete(`/admin/prizes/${prizeId}`);
      showNotification('獎品已成功刪除。', 'success');
      fetchPrizes();
    } catch (err) {
      showNotification('刪除獎品失敗。', 'error');
      console.error('Delete prize error:', err);
    }
  };

  const handlePrizeSubmit = async (prizeData) => {
    try {
      // Backend uses POST /admin/prizes for both create and update,
      // distinguishing by the presence of 'id' in the payload.
      await api.post('/admin/prizes', prizeData);
      showNotification(`獎品${prizeData.id ? '已更新' : '已新增'}成功。`, 'success');
      setShowPrizeModal(false);
      fetchPrizes();
    } catch (err) {
      showNotification('儲存獎品失敗。', 'error');
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
    if (!window.confirm('您確定要刪除此訊息嗎？')) {
      return;
    }
    try {
      await api.delete(`/admin/consolation-messages/${messageId}`);
      showNotification('安慰獎訊息已成功刪除。', 'success');
      fetchConsolationMessages();
    } catch (err) {
      showNotification('刪除安慰獎訊息失敗。', 'error');
      console.error('Delete consolation message error:', err);
    }
  };

  const handleConsolationMessageSubmit = async (messageData) => {
    try {
      // Backend uses POST /admin/consolation-messages for both create and update,
      // distinguishing by the presence of 'id' in the payload.
      await api.post('/admin/consolation-messages', messageData);
      showNotification(`安慰獎訊息${messageData.id ? '已更新' : '已新增'}成功。`, 'success');
      setShowConsolationModal(false);
      fetchConsolationMessages();
    } catch (err) {
      showNotification('儲存安慰獎訊息失敗。', 'error');
      console.error('Save consolation message error:', err);
    }
  };

  if (loading) {
    return <div className="container">載入管理儀表板中...</div>;
  }

  return (
    <div className="container admin-dashboard">
      <h2>管理儀表板</h2>
      <button onClick={handleLogout} className="logout-button">登出</button>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* Prize Management Section */}
      <section className="section">
        <h3>獎品管理</h3>
        <button onClick={handleAddPrize}>新增獎品</button>
        <table>
          <thead>
            <tr>
              <th>名稱</th>
              <th>總數量</th>
              <th>剩餘數量</th>
              <th>機率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {prizes.map((prize) => (
              <tr key={prize.id}>
                <td>{prize.name}</td>
                <td>{prize.total_quantity}</td>
                <td>{prize.remaining_quantity}</td>
                <td>{prize.probability}</td>
                <td>
                  <button onClick={() => handleEditPrize(prize)}>編輯</button>
                  <button onClick={() => handleDeletePrize(prize.id)}>刪除</button>
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
        <h3>安慰獎訊息管理</h3>
        <button onClick={handleAddConsolationMessage}>新增訊息</button>
        <ul>
          {consolationMessages.map((msg) => (
            <li key={msg.id}>
              {msg.message}
              <div>
                <button onClick={() => handleEditConsolationMessage(msg)}>編輯</button>
                <button onClick={() => handleDeleteConsolationMessage(msg.id)}>刪除</button>
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
        <h3>活動設定</h3>
        <div className="form-group">
          <label>
            活動狀態: {activityStatus ? '公開 (無限次嘗試)' : '私人 (基於代幣)'}
            <input
              type="checkbox"
              checked={activityStatus}
              onChange={handleToggleActivityStatus}
            />
          </label>
        </div>

        {!activityStatus && (
          <div className="token-management">
            <h4>代幣管理</h4>
            <form onSubmit={handleGenerateTokens}>
              <div className="form-group">
                <label htmlFor="numTokens">要生成的代幣數量:</label>
                <input
                  type="number"
                  id="numTokens"
                  value={numTokensToGenerate}
                  onChange={(e) => setNumTokensToGenerate(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                />
              </div>
              <button type="submit">生成代幣</button>
            </form>

            <h4>現有代幣</h4>
            <ul>
              {tokens.map((token) => (
                <li key={token.id}>
                  {token.token} - {token.is_used ? '已使用' : '未使用'} {/* Use token.is_used */}
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
