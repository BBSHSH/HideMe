import React, { useState } from 'react';
import './css/filemanage.css';
import Header from './components/Header';

export default function FileManage() {
  const [selectedTab, setSelectedTab] = useState('all'); // all, videos, images, audio, documents
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [sortBy, setSortBy] = useState('date'); // date, name, size

  const [mediaItems] = useState([
    { 
      id: 1, 
      name: 'プロジェクト紹介動画.mp4', 
      type: 'video', 
      size: '45.2 MB', 
      duration: '3:24',
      thumbnail: '🎥',
      uploadedBy: '田中 太郎', 
      date: '2024/12/09 10:30',
      resolution: '1920x1080',
      views: 124
    },
    { 
      id: 2, 
      name: '会議録音_1209.mp3', 
      type: 'audio', 
      size: '12.8 MB', 
      duration: '45:12',
      thumbnail: '🎵',
      uploadedBy: '山田 花子', 
      date: '2024/12/09 09:15',
      bitrate: '320kbps',
      plays: 34
    },
    { 
      id: 3, 
      name: 'デザインモックアップ_v2.png', 
      type: 'image', 
      size: '3.4 MB', 
      thumbnail: '🖼️',
      uploadedBy: '佐藤 次郎', 
      date: '2024/12/08 16:45',
      resolution: '2560x1440',
      views: 89
    },
    { 
      id: 4, 
      name: '製品カタログ.pdf', 
      type: 'document', 
      size: '8.9 MB', 
      pages: 24,
      thumbnail: '📄',
      uploadedBy: '鈴木 美咲', 
      date: '2024/12/08 14:20',
      views: 156
    },
    { 
      id: 5, 
      name: 'チュートリアル動画.mp4', 
      type: 'video', 
      size: '78.5 MB', 
      duration: '8:15',
      thumbnail: '🎬',
      uploadedBy: '高橋 健', 
      date: '2024/12/07 11:00',
      resolution: '3840x2160',
      views: 267
    },
    { 
      id: 6, 
      name: 'バナー画像_冬.jpg', 
      type: 'image', 
      size: '2.1 MB', 
      thumbnail: '🖼️',
      uploadedBy: '伊藤 愛', 
      date: '2024/12/07 10:30',
      resolution: '1920x1080',
      views: 203
    },
    { 
      id: 7, 
      name: 'ポッドキャスト_ep12.mp3', 
      type: 'audio', 
      size: '28.4 MB', 
      duration: '1:02:34',
      thumbnail: '🎙️',
      uploadedBy: '渡辺 翔', 
      date: '2024/12/06 18:45',
      bitrate: '256kbps',
      plays: 412
    },
    { 
      id: 8, 
      name: '年次報告書_2024.pdf', 
      type: 'document', 
      size: '15.6 MB', 
      pages: 87,
      thumbnail: '📊',
      uploadedBy: '中村 優', 
      date: '2024/12/06 15:20',
      views: 523
    },
    { 
      id: 9, 
      name: 'インタビュー動画.mov', 
      type: 'video', 
      size: '156.3 MB', 
      duration: '15:42',
      thumbnail: '📹',
      uploadedBy: '小林 健太', 
      date: '2024/12/05 13:10',
      resolution: '1920x1080',
      views: 189
    },
    { 
      id: 10, 
      name: 'ロゴデザイン_案.svg', 
      type: 'image', 
      size: '0.8 MB', 
      thumbnail: '🎨',
      uploadedBy: '加藤 真理', 
      date: '2024/12/05 09:30',
      resolution: 'Vector',
      views: 145
    },
  ]);

  const getFilteredItems = () => {
    let filtered = mediaItems;
    
    if (selectedTab !== 'all') {
      filtered = mediaItems.filter(item => {
        if (selectedTab === 'videos') return item.type === 'video';
        if (selectedTab === 'images') return item.type === 'image';
        if (selectedTab === 'audio') return item.type === 'audio';
        if (selectedTab === 'documents') return item.type === 'document';
        return true;
      });
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return parseFloat(b.size) - parseFloat(a.size);
      return 0;
    });

    return filtered;
  };

  const toggleMediaSelection = (mediaId) => {
    setSelectedMedia(prev => 
      prev.includes(mediaId) 
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      video: '🎥',
      image: '🖼️',
      audio: '🎵',
      document: '📄'
    };
    return icons[type] || '📁';
  };

  const getTypeColor = (type) => {
    const colors = {
      video: '#f39c12',
      image: '#9b59b6',
      audio: '#1abc9c',
      document: '#3498db'
    };
    return colors[type] || '#7f8c8d';
  };

  const filteredItems = getFilteredItems();
  const totalSize = mediaItems.reduce((acc, item) => acc + parseFloat(item.size), 0);

  const stats = {
    all: mediaItems.length,
    videos: mediaItems.filter(i => i.type === 'video').length,
    images: mediaItems.filter(i => i.type === 'image').length,
    audio: mediaItems.filter(i => i.type === 'audio').length,
    documents: mediaItems.filter(i => i.type === 'document').length,
  };

  return (
    <div className="app">
      <Header />
      <div className="media-container">
        {/* Stats Bar */}
        <section className="media-stats-bar">
          <div className="stats-cards">
            <div className="mini-stat-card">
              <div className="mini-stat-icon">📁</div>
              <div className="mini-stat-content">
                <div className="mini-stat-value">{mediaItems.length}</div>
                <div className="mini-stat-label">総ファイル数</div>
              </div>
            </div>
            <div className="mini-stat-card">
              <div className="mini-stat-icon">💾</div>
              <div className="mini-stat-content">
                <div className="mini-stat-value">{totalSize.toFixed(1)} MB</div>
                <div className="mini-stat-label">総容量</div>
              </div>
            </div>
            <div className="mini-stat-card">
              <div className="mini-stat-icon">👁️</div>
              <div className="mini-stat-content">
                <div className="mini-stat-value">
                  {mediaItems.reduce((acc, item) => acc + (item.views || item.plays || 0), 0)}
                </div>
                <div className="mini-stat-label">総視聴/再生</div>
              </div>
            </div>
            <div className="mini-stat-card">
              <div className="mini-stat-icon">📅</div>
              <div className="mini-stat-content">
                <div className="mini-stat-value">今日</div>
                <div className="mini-stat-label">最終更新</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="media-tabs">
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              <span className="tab-icon">📂</span>
              すべて
              <span className="tab-count">{stats.all}</span>
            </button>
            <button 
              className={`tab-btn ${selectedTab === 'videos' ? 'active' : ''}`}
              onClick={() => setSelectedTab('videos')}
            >
              <span className="tab-icon">🎥</span>
              動画
              <span className="tab-count">{stats.videos}</span>
            </button>
            <button 
              className={`tab-btn ${selectedTab === 'images' ? 'active' : ''}`}
              onClick={() => setSelectedTab('images')}
            >
              <span className="tab-icon">🖼️</span>
              画像
              <span className="tab-count">{stats.images}</span>
            </button>
            <button 
              className={`tab-btn ${selectedTab === 'audio' ? 'active' : ''}`}
              onClick={() => setSelectedTab('audio')}
            >
              <span className="tab-icon">🎵</span>
              音声
              <span className="tab-count">{stats.audio}</span>
            </button>
            <button 
              className={`tab-btn ${selectedTab === 'documents' ? 'active' : ''}`}
              onClick={() => setSelectedTab('documents')}
            >
              <span className="tab-icon">📄</span>
              文書
              <span className="tab-count">{stats.documents}</span>
            </button>
          </div>

          <div className="tab-actions">
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">日付順</option>
              <option value="name">名前順</option>
              <option value="size">サイズ順</option>
            </select>
            <button 
              className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="グリッド表示"
            >
              ⊞
            </button>
            <button 
              className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="リスト表示"
            >
              ☰
            </button>
          </div>
        </section>

        {/* Media Display */}
        <section className="media-display">
          {viewMode === 'grid' ? (
            <div className="media-grid">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`media-card ${selectedMedia.includes(item.id) ? 'selected' : ''}`}
                  onClick={() => toggleMediaSelection(item.id)}
                >
                  <div className="media-checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedMedia.includes(item.id)}
                      onChange={() => {}}
                    />
                  </div>
                  
                  <div 
                    className="media-thumbnail"
                    style={{ backgroundColor: getTypeColor(item.type) }}
                  >
                    <div className="media-thumb-icon">{item.thumbnail}</div>
                    {item.duration && (
                      <div className="media-duration">{item.duration}</div>
                    )}
                  </div>

                  <div className="media-info">
                    <div className="media-type-badge" style={{ backgroundColor: getTypeColor(item.type) }}>
                      {item.type}
                    </div>
                    <div className="media-name" title={item.name}>{item.name}</div>
                    <div className="media-meta">
                      <span>{item.size}</span>
                      {item.resolution && (
                        <>
                          <span>•</span>
                          <span>{item.resolution}</span>
                        </>
                      )}
                      {item.pages && (
                        <>
                          <span>•</span>
                          <span>{item.pages}ページ</span>
                        </>
                      )}
                    </div>
                    <div className="media-stats-row">
                      <span>👁️ {item.views || item.plays || 0}</span>
                      <span>{item.uploadedBy}</span>
                    </div>
                    <div className="media-date">{item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="media-list">
              <div className="media-list-header">
                <div className="list-col-preview">プレビュー</div>
                <div className="list-col-details">詳細</div>
                <div className="list-col-uploader">アップロード者</div>
                <div className="list-col-stats">統計</div>
                <div className="list-col-date">日時</div>
                <div className="list-col-actions">操作</div>
              </div>
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`media-list-item ${selectedMedia.includes(item.id) ? 'selected' : ''}`}
                >
                  <div className="list-col-preview">
                    <input 
                      type="checkbox" 
                      checked={selectedMedia.includes(item.id)}
                      onChange={() => toggleMediaSelection(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div 
                      className="media-thumb-small"
                      style={{ backgroundColor: getTypeColor(item.type) }}
                    >
                      {item.thumbnail}
                    </div>
                  </div>
                  <div className="list-col-details">
                    <div className="list-item-name">{item.name}</div>
                    <div className="list-item-meta">
                      <span className="type-tag" style={{ backgroundColor: getTypeColor(item.type) }}>
                        {item.type}
                      </span>
                      <span>{item.size}</span>
                      {item.duration && <span>{item.duration}</span>}
                      {item.resolution && <span>{item.resolution}</span>}
                      {item.pages && <span>{item.pages}ページ</span>}
                    </div>
                  </div>
                  <div className="list-col-uploader">{item.uploadedBy}</div>
                  <div className="list-col-stats">
                    <span>👁️ {item.views || item.plays || 0}</span>
                  </div>
                  <div className="list-col-date">{item.date}</div>
                  <div className="list-col-actions">
                    <button className="action-icon" title="再生/表示">▶️</button>
                    <button className="action-icon" title="ダウンロード">⬇️</button>
                    <button className="action-icon" title="編集">✏️</button>
                    <button className="action-icon" title="共有">🔗</button>
                    <button className="action-icon" title="削除">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Selected Actions */}
        {selectedMedia.length > 0 && (
          <div className="selected-actions-bar">
            <span className="selected-text">{selectedMedia.length}個のアイテムを選択中</span>
            <div className="action-btn-group">
              <button className="action-btn play-btn">▶️ 再生</button>
              <button className="action-btn download-btn">⬇️ ダウンロード</button>
              <button className="action-btn edit-btn">✏️ 編集</button>
              <button className="action-btn share-btn">🔗 共有</button>
              <button className="action-btn delete-btn">🗑️ 削除</button>
              <button className="action-btn cancel-btn" onClick={() => setSelectedMedia([])}>
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}