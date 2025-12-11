import React, { useState, useRef, useEffect } from 'react';
import { GetVideoInfo, ExportVideo, SelectFile } from '../wailsjs/go/app/VideoEditorApp';
import Header from './components/Header';
import './css/Editor.css';

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
  const [resolution, setResolution] = useState('720p');

  const videoRef = useRef(null);
  const timelineRef = useRef(null);

// handleSelect 関数内の videoUrl 設定を変更

const handleSelect = async () => {
  try {
    const file = await SelectFile();
    if (!file) return;

    console. log('Selected file:', file);
    setVideoPath(file);
    setStatus('動画を読み込み中...');

    const info = await GetVideoInfo(file);
    console.log('Video info:', info);
    setVideoInfo(info);
    setEndTime(info. duration);
    setStartTime(0);
    setCurrentTime(0);

    // パスをURLエンコードしてローカルファイルプロトコルで読み込み
    const encodedPath = encodeURIComponent(file).replace(/%2F/g, '/').replace(/%3A/g, ':');
    const videoUrl = `/localfile/${encodedPath}`;
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
      resolution, // ← これが抜けていた！
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
    if (seconds == null || isNaN(seconds)) return '00:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    const [secInt, secDec] = secs.split('.');
    return `${mins.toString().padStart(2,'0')}:${secInt.padStart(2,'0')}.${secDec}`;
  };

  const resetRange = () => {
    setStartTime(0);
    setEndTime(videoInfo?.duration || 0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          videoRef.current.currentTime = Math.max(startTime, videoRef.current.currentTime - 5);
          setCurrentTime(videoRef.current.currentTime);
          break;
        case "ArrowRight":
          e.preventDefault();
          videoRef.current.currentTime = Math.min(endTime, videoRef.current.currentTime + 5);
          setCurrentTime(videoRef.current.currentTime);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((prev) => {
            const newVol = Math.min(1, prev + 0.05);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((prev) => {
            const newVol = Math.max(0, prev - 0.05);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startTime, endTime, isPlaying]);

  const getTimelinePosition = (time) => {
    if (!videoInfo || !videoInfo.duration) return 0;
    return (time / videoInfo.duration) * 100;
  };

  return (
    <div className="app">
      <Header/>
      <div className="main-container">
        <div className="left-panel">
          <div
            className="preview-container"
            onClick={videoURL ? handlePlayPause : handleSelect}
          >
            {videoURL ? (
              <video
                ref={videoRef}
                src={videoURL}
                className="preview-video"
                onError={(e) => {
                  console.error('Video error:', e);
                  setStatus('動画の読み込みに失敗しました');
                }}
                controls={false}
              />
            ) : (
              <div className="preview-placeholder">
                <p>クリックして動画を選択</p>
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
              <div className="timeline-track"></div>
              
              <div 
                className="timeline-range"
                style={{
                  left: `${getTimelinePosition(startTime)}%`,
                  width: `${getTimelinePosition(endTime) - getTimelinePosition(startTime)}%`
                }}
              ></div>
              
              {videoInfo && currentTime >= startTime && currentTime <= endTime && (
                <div 
                  className="timeline-current"
                  style={{
                    left: `${getTimelinePosition(currentTime)}%`
                  }}
                ></div>
              )}
              
              <div 
                className="timeline-handle timeline-handle-start"
                style={{
                  left: `${getTimelinePosition(startTime)}%`
                }}
                onMouseDown={(e) => handleStartDrag(e, 'start')}
              >
                <div className="handle-grip"></div>
              </div>
              
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
            <button className="btn" onClick={resetRange} disabled={!videoInfo}>
              範囲リセット
            </button>
            <button className="btn btn-primary" onClick={handleSelect}>
              動画ファイルを開く
            </button>
          </div>
          
        </div>

        <div className="right-panel">
          <div className="settings-section">
            <h3>音量調整</h3>
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
          <div className="resolution-section">
            <label>
              <h3>解像度</h3>
              <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
              </select>
            </label>
          </div>
          <div className="export-section">
            <button
              className="btn btn-export"
              onClick={handleExport}
              disabled={!videoInfo || isExporting}
            >
              {isExporting ? '処理中...' : '動画を保存'}
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