// src/Home.jsx
import React, { useState } from 'react';
import Header from './components/Header';

export default function Home() {
  const [status, setStatus] = useState("未接続");

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/connect', { method: 'POST' });
      if (res.ok) {
        setStatus("接続成功！");
      } else {
        setStatus("接続失敗");
      }
    } catch (err) {
      console.error(err);
      setStatus("エラー発生");
    }
  };

  return (
    <div>
      <Header title="🎬 動画編集 - Video Editor" />
      <h1>Home Screen</h1>
      <p>ここが最初の画面です。</p>
      <p>upload状況確認</p>
      <p>接続している人やオンラインの人を表示</p>
      <p>tsnet接続設定</p>
      <p>接続先を設定</p>

      <button onClick={handleConnect}>tsnet 接続する</button>
      <p>接続状態: {status}</p>
    </div>
  );
}
