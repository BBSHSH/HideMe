import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './login';
import Home from './home';
import Editor from './editor';
import Chat from './chat';
import File from './file';
import FileManage from './filemanage';

import './css/app.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setInitializing(false);
  }, []);

  const handleLoginSuccess = (user, token) => {
    setUser(user);
    setToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setUser(null);
    setToken(null);
  };

  if (initializing) {
    return (
      <div className="app-loading">
        起動中...
      </div>
    );
  }

  // 未ログイン
  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // グイン済み
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home user={user} onLogout={handleLogout} />} />
        <Route path="/chat" element={<Chat user={user} />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/file" element={<File />} />
        <Route path="/filemanage" element={<FileManage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
