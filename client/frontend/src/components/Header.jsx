import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="app-header">
      <div className="logo-container">
        <img className="logo" src="../src/assets/images/HideMe.png" alt="Logo" />
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
          動画編集
        </NavLink>

        <NavLink 
          to="/filemanage" 
          className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}
        >
          管理
        </NavLink>
      </nav>

      <div className="profile-button">
        <img className="profile-avatar" src="../src/assets/images/koba.jpg" alt="あなた" />
      </div>
    </header>
  );
}
