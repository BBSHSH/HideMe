import React, { useState, useRef, useEffect } from 'react';
import { GetVideoInfo, ExportVideo, SelectFile } from '../wailsjs/go/main/App';
import Header from './components/Header';
import './App.css';

function App() {
  const [videoPath, setVideoPath] = useState('');
  const [videoURL, setVideoURL] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState('動画ファイルを選択してください');
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);

  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  const handleSelect = async () => {
    try {
      const file = await SelectFile();
      if (!file) return;

      console.log('Selected file:', file);
      setVideoPath(file);
      setStatus('動画を読み込み中...');

      const info = await GetVideoInfo(file);
      console.log('Video info:', info);
      setVideoInfo(info);
      setEndTime(info.duration);
      setStartTime(0);
      setCurrentTime(0);

      const videoUrl = `http://127.0.0.1:8082/video?path=${encodeURIComponent(file)}`;
      console.log('Video URL:', videoUrl);
      setVideoURL(videoUrl);

      setStatus(`動画が読み込まれました (${formatTime(info.duration)})`);
    } catch (error) {
      console.error('Error:', error);
      setStatus(`エラー: ${error}`);
      alert(`エラー: ${error}`);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setStatus('停止');
    } else {
      // 開始位置から再生
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
      setStatus('再生中...');
    }
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !videoInfo || isDraggingStart || isDraggingEnd) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const time = Math.max(startTime, Math.min(endTime, percentage * videoInfo.duration));
    
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleExport = async () => {
    if (!videoPath) {
      alert('動画ファイルを選択してください');
      return;
    }

    const outputPath = prompt(
      '保存先のパスを入力してください:',
      videoPath.replace(/\.[^.]+$/, '_edited.mp4')
    );

    if (!outputPath) return;

    setIsExporting(true);
    setStatus('動画を処理中...');

    const options = {
      inputPath: videoPath,
      outputPath,
      startTime,
      endTime,
      volume,
    };

    try {
      await ExportVideo(options);
      setStatus('保存完了!');
      alert(`動画を保存しました:\n${outputPath}`);
    } catch (error) {
      setStatus(`エラー: ${error}`);
      alert(`エラー: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRange = () => {
    setStartTime(0);
    setEndTime(videoInfo?.duration || 0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // ドラッグハンドラー
  const handleStartDrag = (e, type) => {
    e.stopPropagation();
    if (type === 'start') {
      setIsDraggingStart(true);
    } else {
      setIsDraggingEnd(true);
    }
  };

  const handleDragMove = (e) => {
    if (!timelineRef.current || !videoInfo || (!isDraggingStart && !isDraggingEnd)) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, moveX / rect.width));
    const time = percentage * videoInfo.duration;
    
    if (isDraggingStart) {
      const newStart = Math.max(0, Math.min(time, endTime - 0.1));
      setStartTime(newStart);
      if (videoRef.current && videoRef.current.currentTime < newStart) {
        videoRef.current.currentTime = newStart;
      }
    } else if (isDraggingEnd) {
      const newEnd = Math.max(startTime + 0.1, Math.min(time, videoInfo.duration));
      setEndTime(newEnd);
      if (videoRef.current && videoRef.current.currentTime > newEnd) {
        videoRef.current.currentTime = newEnd;
      }
    }
  };

  const handleDragEnd = () => {
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
  };

  // グローバルマウスイベント
  useEffect(() => {
    if (isDraggingStart || isDraggingEnd) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDraggingStart, isDraggingEnd, startTime, endTime, videoInfo]);

  // 動画の時間更新を監視
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // 終了位置に達したら停止
      if (video.currentTime >= endTime && endTime > 0) {
        video.pause();
        setIsPlaying(false);
        setStatus('再生完了');
        video.currentTime = startTime;
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [endTime, startTime]);

  // 音量を設定
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // タイムラインの位置計算
  const getTimelinePosition = (time) => {
    if (!videoInfo || !videoInfo.duration) return 0;
    return (time / videoInfo.duration) * 100;
  };

  return (
    <div className="app">
      <Header title="🎬 動画編集 - Video Editor" />
      <div className="main-container">
        <div className="left-panel">
            <div className="preview-container" onClick={!videoURL ? handleSelect : undefined}>
            {videoURL ? (
                <video
                ref={videoRef}
                src={videoURL}
                className="preview-video"
                onError={(e) => {
                    console.error('Video error:', e);
                    setStatus('動画の読み込みに失敗しました');
                }}
                controls
                />
            ) : (
                <div className="preview-placeholder">
                <p>ここをクリックして動画を選択してください</p>
                </div>
            )}
            </div>

          <div className="timeline-container">
            <div className="time-labels">
              <span>{formatTime(startTime)}</span>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(endTime)}</span>
            </div>
            
            <div 
              ref={timelineRef}
              className="integrated-timeline"
              onClick={handleTimelineClick}
            >
              {/* 背景バー */}
              <div className="timeline-track"></div>
              
              {/* 選択範囲 */}
              <div 
                className="timeline-range"
                style={{
                  left: `${getTimelinePosition(startTime)}%`,
                  width: `${getTimelinePosition(endTime) - getTimelinePosition(startTime)}%`
                }}
              ></div>
              
              {/* 再生位置インジケーター */}
              {videoInfo && currentTime >= startTime && currentTime <= endTime && (
                <div 
                  className="timeline-current"
                  style={{
                    left: `${getTimelinePosition(currentTime)}%`
                  }}
                ></div>
              )}
              
              {/* 開始ハンドル */}
              <div 
                className="timeline-handle timeline-handle-start"
                style={{
                  left: `${getTimelinePosition(startTime)}%`
                }}
                onMouseDown={(e) => handleStartDrag(e, 'start')}
              >
                <div className="handle-grip"></div>
              </div>
              
              {/* 終了ハンドル */}
              <div 
                className="timeline-handle timeline-handle-end"
                style={{
                  left: `${getTimelinePosition(endTime)}%`
                }}
                onMouseDown={(e) => handleStartDrag(e, 'end')}
              >
                <div className="handle-grip"></div>
              </div>
            </div>
            
            <div className="range-info">
              選択範囲: {formatTime(endTime - startTime)}
            </div>
          </div>

          <div className="controls">
            <button
              className="btn btn-play"
              onClick={handlePlayPause}
              disabled={!videoInfo}
            >
              {isPlaying ? '⏸️ 停止' : '▶️ 再生'}
            </button>
            <button className="btn" onClick={resetRange} disabled={!videoInfo}>
              🔄 範囲リセット
            </button>
            <button className="btn btn-primary" onClick={handleSelect}>
              📁 動画ファイルを開く
            </button>
          </div>
          
        </div>

        <div className="right-panel">
          <div className="settings-section">
            <h3>🔊 音量調整</h3>
            <div className="slider-group">
              <label>
                音量: {Math.round(volume * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="range-slider"
                />
              </label>
            </div>
          </div>

          <div className="export-section">
            <button
              className="btn btn-export"
              onClick={handleExport}
              disabled={!videoInfo || isExporting}
            >
              {isExporting ? '処理中...' : '💾 動画を保存'}
            </button>
          </div>

          <div className="status-section">
            <p className="status-text">{status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;