import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './home';
import Editor from './editor';
import Chat from './chat';
import File from './file';
import FileManage from './filemanage';

import './css/app.css';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState("connected");
  //接続状態の監視
  useEffect(() => {
    if (window.runtime && window.runtime.EventsOn) {
      window.runtime.EventsOn("connection_status", (status) => {
        console.log("接続ステータス:", status);
        setConnectionStatus(status);
      });
    }
  }, []);

  const isError = connectionStatus !== "connected";

  return (
    <div className="app-container">

      <div className={`app-content ${isError ? 'blurred' : ''}`}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/file" element={<File />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/filemanage" element={<FileManage />} />
          </Routes>
        </Router>
      </div>

      {isError && (
        <div className="connection-overlay">
          <div className="overlay-box">
            <h1 className="overlay-title">tsnetに接続できません</h1>
            <p className="overlay-message">
              tsnetがオフラインか、ネットワークに問題があります。<br />
              再接続を試みています...<br /><br />

              時間がたっても解決しない場合は、再インストールをお試しください。
            </p>
            <div className="overlay-status">
              現在の状態: <b>{connectionStatus}</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
