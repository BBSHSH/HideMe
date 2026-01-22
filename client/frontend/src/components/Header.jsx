import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

export default function Header({ user, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        await fetch('http://localhost:9000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      // エラーが出ても必ずログアウト処理を実行
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <header className="app-header-modern">
      <div className="logo-container">
        <img className="logo" src="../src/assets/images/HideMe.png" alt="HideMe Logo" />
        <div className="title">HideMe!</div>
      </div>

      <nav className="nav-buttons">
        <NavLink
          to="/"
          className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}
        >
          ホーム
        </NavLink>
        <NavLink
          to="/chat"
          className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}
        >
          チャット
        </NavLink>
        <NavLink
          to="/file"
          className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}
        >
          ファイル
        </NavLink>
        <NavLink
          to="/editor"
          className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}
        >
          動画
        </NavLink>
      </nav>

      {user && (
        <div className="profile-section" ref={dropdownRef}>
          <button
            className="profile-avatar-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="プロフィールメニュー"
          >
            <div className="avatar-circle">
              {user.avatar || user.displayName?.charAt(0) || user.username?.charAt(0) || '?'}
            </div>
          </button>

          {showDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {user.avatar || user.displayName?.charAt(0) || user.username?.charAt(0) || '?'}
                </div>
                <div className="dropdown-user-info">
                  <div className="dropdown-display-name">
                    {user.displayName || user.username}
                  </div>
                  <div className="dropdown-username">
                    @{user.username}
                  </div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button
                className="dropdown-item logout-btn"
                onClick={handleLogout}
              >
                <span className="dropdown-icon">🚪</span>
                ログアウト
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
