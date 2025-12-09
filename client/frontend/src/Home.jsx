import React, { useState } from 'react';
import './css/home.css';
import Header from './components/Header';

export default function Home() {
  const [activities] = useState([
    { id: 1, type: 'chat', user: '田中 太郎', action: '新しいメッセージを送信しました', time: '5分前', avatar: 'T' },
    { id: 2, type: 'file', user: '山田 花子', action: 'プレゼン資料.pptxをアップロードしました', time: '15分前', avatar: 'Y' },
    { id: 3, type: 'video', user: '佐藤 次郎', action: '動画を編集しました', time: '1時間前', avatar: 'S' },
    { id: 4, type: 'chat', user: '鈴木 美咲', action: 'グループチャットに参加しました', time: '2時間前', avatar: 'M' },
  ]);

  const [quickActions] = useState([
    { id: 1, title: '新規チャット', icon: '💬', color: '#5865f2', path: '/chat' },
    { id: 2, title: 'ファイル管理', icon: '📁', color: '#57f287', path: '/file' },
    { id: 3, title: '動画編集', icon: '🎬', color: '#eb459e', path: '/editor' },
    { id: 4, title: '設定', icon: '⚙️', color: '#fee75c', path: '/settings' },
  ]);

  const [stats] = useState([
    { label: '未読メッセージ', value: '12', icon: '💬', trend: '+3' },
    { label: '保存ファイル', value: '48', icon: '📁', trend: '+5' },
    { label: '編集した動画', value: '7', icon: '🎥', trend: '+2' },
    { label: 'オンライン', value: '15', icon: '🟢', trend: '+4' },
  ]);

  return (
    <div className="app">
      <Header />
      <div className="home-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">おかえりなさい 👋</h1>
            <p className="hero-subtitle">今日も素晴らしい一日を始めましょう</p>
          </div>
          <div className="hero-time">
            <div className="current-time">{new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="current-date">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            {stats.map(stat => (
              <div key={stat.label} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-content">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
                <div className="stat-trend">{stat.trend}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="main-grid">
          {/* Quick Actions */}
          <section className="quick-actions-section">
            <h2 className="section-title">クイックアクション</h2>
            <div className="quick-actions-grid">
              {quickActions.map(action => (
                <div 
                  key={action.id} 
                  className="action-card"
                  style={{ '--card-color': action.color }}
                >
                  <div className="action-icon">{action.icon}</div>
                  <div className="action-title">{action.title}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="activity-section">
            <h2 className="section-title">最近のアクティビティ</h2>
            <div className="activity-list">
              {activities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-avatar">{activity.avatar}</div>
                  <div className="activity-content">
                    <div className="activity-user">{activity.user}</div>
                    <div className="activity-action">{activity.action}</div>
                  </div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              ))}
            </div>
            <button className="view-all-btn">すべて表示</button>
          </section>
        </div>

        {/* Featured Section */}
        <section className="featured-section">
          <h2 className="section-title">おすすめ機能</h2>
          <div className="featured-grid">
            <div className="featured-card large">
              <div className="featured-badge">NEW</div>
              <h3 className="featured-title">AIチャットアシスタント</h3>
              <p className="featured-description">最新のAI技術を使って、より賢く会話をサポート</p>
              <button className="featured-btn">試してみる</button>
            </div>
            <div className="featured-card">
              <h3 className="featured-title">動画編集の新機能</h3>
              <p className="featured-description">エフェクトとフィルターが追加されました</p>
              <button className="featured-btn">詳しく見る</button>
            </div>
            <div className="featured-card">
              <h3 className="featured-title">ファイル同期</h3>
              <p className="featured-description">クラウドストレージと自動同期</p>
              <button className="featured-btn">設定する</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}