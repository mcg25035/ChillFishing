import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ParticipantEntryPage from './pages/ParticipantEntryPage';
import RafflePage from './pages/RafflePage';
import ProjectionViewPage from './pages/ProjectionViewPage';
import './App.css'; // Import the main CSS file

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <nav className="navbar">
            <ul>
              <li>
                <Link to="/">參與者入口</Link>
              </li>
              <li>
                <Link to="/admin">管理員登入</Link>
              </li>
              <li>
                <Link to="/projection">投影頁面登入</Link>
              </li>
            </ul>
          </nav>

          <Routes>
            <Route path="/" element={<ParticipantEntryPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/raffle" element={<RafflePage />} />
            <Route path="/projection" element={<ProjectionViewPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
