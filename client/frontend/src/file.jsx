import React, { useState } from 'react';
import './css/file.css';
import Header from './components/Header';

export default function File() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 1, name: 'プレゼン資料.pptx', size: '2.4 MB', type: 'pptx', uploadedBy: '田中 太郎', date: '2024/12/08', status: 'completed' },
    { id: 2, name: '会議録音.mp3', size: '15.8 MB', type: 'mp3', uploadedBy: '山田 花子', date: '2024/12/07', status: 'completed' },
    { id: 3, name: '予算表.xlsx', size: '1.2 MB', type: 'xlsx', uploadedBy: '佐藤 次郎', date: '2024/12/06', status: 'completed' },
    { id: 4, name: 'プロジェクト計画.pdf', size: '3.7 MB', type: 'pdf', uploadedBy: '鈴木 美咲', date: '2024/12/05', status: 'completed' },
    { id: 5, name: 'デザインモックアップ.png', size: '5.1 MB', type: 'png', uploadedBy: '高橋 健', date: '2024/12/04', status: 'completed' },
  ]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterType, setFilterType] = useState('all');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // ここでファイル処理のロジックを実装
    console.log('Files dropped:', e.dataTransfer.files);
  };

  const handleFileSelect = (e) => {
    // ここでファイル選択のロジックを実装
    console.log('Files selected:', e.target.files);
  };

  const getFileIcon = (type) => {
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📊',
      pptx: '📊',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎥',
      avi: '🎥',
      mov: '🎥',
      mp3: '🎵',
      wav: '🎵',
      zip: '📦',
      rar: '📦',
    };
    return icons[type] || '📁';
  };

  const getFileColor = (type) => {
    const colors = {
      pdf: '#e74c3c',
      doc: '#3498db',
      docx: '#3498db',
      xls: '#27ae60',
      xlsx: '#27ae60',
      ppt: '#e67e22',
      pptx: '#e67e22',
      jpg: '#9b59b6',
      jpeg: '#9b59b6',
      png: '#9b59b6',
      gif: '#9b59b6',
      mp4: '#f39c12',
      avi: '#f39c12',
      mov: '#f39c12',
      mp3: '#1abc9c',
      wav: '#1abc9c',
      zip: '#95a5a6',
      rar: '#95a5a6',
    };
    return colors[type] || '#7f8c8d';
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const filteredFiles = filterType === 'all' 
    ? uploadedFiles 
    : uploadedFiles.filter(file => file.type === filterType);

  const storageUsed = uploadedFiles.reduce((acc, file) => {
    const size = parseFloat(file.size);
    return acc + size;
  }, 0);

  return (
    <div className="app">
      <Header />
      <div className="file-container">
        {/* Upload Area */}
        <section className="upload-section">
          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="upload-icon">☁️</div>
            <h2 className="upload-title">ファイルをドラッグ＆ドロップ</h2>
            <p className="upload-subtitle">または</p>
            <label className="upload-btn">
              ファイルを選択
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
            <p className="upload-info">最大100MBまで対応</p>
          </div>

          {/* Storage Info */}
          <div className="storage-info">
            <div className="storage-header">
              <span className="storage-label">ストレージ使用量</span>
              <span className="storage-text">{storageUsed.toFixed(1)} MB / 100 GB</span>
            </div>
            <div className="storage-bar">
              <div className="storage-progress" style={{ width: `${(storageUsed / 102400) * 100}%` }}></div>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <section className="toolbar">
          <div className="toolbar-left">
            <h2 className="files-title">マイファイル ({filteredFiles.length})</h2>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                すべて
              </button>
              <button 
                className={`filter-btn ${filterType === 'pdf' ? 'active' : ''}`}
                onClick={() => setFilterType('pdf')}
              >
                PDF
              </button>
              <button 
                className={`filter-btn ${filterType === 'xlsx' ? 'active' : ''}`}
                onClick={() => setFilterType('xlsx')}
              >
                Excel
              </button>
              <button 
                className={`filter-btn ${filterType === 'png' ? 'active' : ''}`}
                onClick={() => setFilterType('png')}
              >
                画像
              </button>
              <button 
                className={`filter-btn ${filterType === 'mp3' ? 'active' : ''}`}
                onClick={() => setFilterType('mp3')}
              >
                音声
              </button>
            </div>
          </div>
          <div className="toolbar-right">
            <button className="search-btn" title="検索">🔍</button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="グリッド表示"
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="リスト表示"
            >
              ☰
            </button>
          </div>
        </section>

        {/* Files Display */}
        <section className="files-section">
          {viewMode === 'grid' ? (
            <div className="files-grid">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className={`file-card ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <div className="file-checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => {}}
                    />
                  </div>
                  <div 
                    className="file-icon-large"
                    style={{ backgroundColor: getFileColor(file.type) }}
                  >
                    {getFileIcon(file.type)}
                  </div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.date}</span>
                  </div>
                  <div className="file-uploader">{file.uploadedBy}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="files-list">
              <div className="list-header">
                <div className="list-col-name">名前</div>
                <div className="list-col-uploader">アップロード者</div>
                <div className="list-col-date">日付</div>
                <div className="list-col-size">サイズ</div>
                <div className="list-col-actions">操作</div>
              </div>
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className={`list-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                >
                  <div className="list-col-name">
                    <input 
                      type="checkbox" 
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div 
                      className="file-icon-small"
                      style={{ backgroundColor: getFileColor(file.type) }}
                    >
                      {getFileIcon(file.type)}
                    </div>
                    <span className="file-name-text">{file.name}</span>
                  </div>
                  <div className="list-col-uploader">{file.uploadedBy}</div>
                  <div className="list-col-date">{file.date}</div>
                  <div className="list-col-size">{file.size}</div>
                  <div className="list-col-actions">
                    <button className="action-icon-btn" title="ダウンロード">⬇️</button>
                    <button className="action-icon-btn" title="共有">🔗</button>
                    <button className="action-icon-btn" title="削除">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Selected Actions */}
        {selectedFiles.length > 0 && (
          <div className="selected-actions">
            <span className="selected-count">{selectedFiles.length}個のファイルを選択中</span>
            <div className="action-buttons">
              <button className="action-btn-primary">ダウンロード</button>
              <button className="action-btn-secondary">共有</button>
              <button className="action-btn-danger">削除</button>
              <button className="action-btn-secondary" onClick={() => setSelectedFiles([])}>
                選択解除
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}