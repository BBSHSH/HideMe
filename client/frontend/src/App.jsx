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

  useEffect(() => {
    if (window.runtime?.EventsOn) {
      window.runtime.EventsOn("connection_status", (status) => {
        setConnectionStatus(status);
      });
    }
  }, []);
  const localStatus = (connectionStatus === "connected" || connectionStatus === "tsnet_disconnected") ? "ok" : "ng";
  
  let tsnetStatus;
  if (localStatus === "ng") {
    tsnetStatus = "disabled"; 
  } else {
    tsnetStatus = connectionStatus === "connected" ? "ok" : "connecting";
  }

  const isError = localStatus !== "ok" || tsnetStatus !== "ok";

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
            <h1 className="overlay-title">SYSTEM STATUS</h1>

            <div className="connection-flow">
              <FlowItem label="クライアント" status="ok" />
              <FlowConnector />
              <FlowItem label="tsnet ローカル" status={localStatus} />
              <FlowConnector disabled={tsnetStatus === "disabled"} />
              <FlowItem label="tsnet サーバー" status={tsnetStatus} />
            </div>

            <p className="overlay-message">
              {localStatus === "ng" 
                ? "ローカルサービスが起動していません。" 
                : "接続を自動修復しています。そのままお待ちください。"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FlowItem({ label, status }) {
  const statusLabels = {
    ok: "接続済み",
    ng: "未接続",
    connecting: "接続試行中",
    disabled: "接続不可"
  };

  return (
    <div className={`flow-item ${status}`}>
      <span className="flow-label">{label}</span>
      <div className="status-badge-container">
        <span className="status-badge">
          {statusLabels[status]}
          {status === "connecting" && <span className="dots">...</span>}
        </span>
      </div>
    </div>
  );
}

function FlowConnector({ disabled }) {
  return <div className={`flow-connector ${disabled ? 'disabled' : ''}`} />;
}