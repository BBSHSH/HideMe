import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header class="app-header-modern">
        <div class="logo-container">
            <img class="logo" src="../logo/HideMe.png"></img>
            <div class="title">HideMe!</div>
        </div>

      <nav class="nav-buttons">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? 'nav-btn active' : 'nav-btn'
          }
        >
          ホーム
        </NavLink>
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            isActive ? 'nav-btn active' : 'nav-btn'
          }
        >
          チャット
        </NavLink>
        <NavLink
          to="/file"
          className={({ isActive }) =>
            isActive ? 'nav-btn active' : 'nav-btn'
          }
        >
          ファイル
        </NavLink>
        <NavLink
          to="/editor"
          className={({ isActive }) =>
            isActive ? 'nav-btn active' : 'nav-btn'
          }
        >
          動画
        </NavLink>
      </nav>
    </header>
  );
}
