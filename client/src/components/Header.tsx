import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';

type User = {
  avatar?: string;
  displayName?: string;
  username?: string;
  role?: string;
};

type Props = {
  user: User;
  onLogout: () => void;
};

export function Header({ user, onLogout }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      if (onLogout) onLogout();
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative pb-1 font-medium transition-colors duration-300 after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-0.5 after:bg-[#f39c12] after:scale-x-0 after:origin-center after:transition-transform after:duration-400 hover:text-[#f39c12] hover:after:scale-x-100 ${
      isActive ? 'text-[#f39c12] after:scale-x-100' : 'text-[#ecf0f1]'
    }`;

  const avatarLabel =
    user?.avatar || user?.displayName?.charAt(0) || user?.username?.charAt(0) || '?';

  return (
    <header className="flex justify-between items-center px-6 py-3 bg-[#2c3e50] text-[#ecf0f1] shadow-md z-[9999]">
      
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img
          src="../src/assets/images/HideMe.png"
          alt="HideMe Logo"
          className="w-10 h-10 object-contain"
        />
        <span className="text-2xl font-semibold">HIDEME</span>
      </div>

      {/* Nav */}
      <nav className="flex gap-4">
        <NavLink to="/" className={navLinkClass}>ホーム</NavLink>
        <NavLink to="/chat" className={navLinkClass}>チャット</NavLink>
        <NavLink to="/file" className={navLinkClass}>ファイル</NavLink>
        <NavLink to="/editor" className={navLinkClass}>動画</NavLink>
        <NavLink to="/filemanage" className={navLinkClass}>管理</NavLink>
      </nav>

      {/* Profile */}
      {user && (
        <div className="relative pl-5" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="プロフィールメニュー"
            className="flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center text-lg font-semibold shadow-md hover:shadow-[0_4px_12px_rgba(102,126,234,0.4)] transition-shadow duration-200">
              {avatarLabel}
            </div>
          </button>

          {showDropdown && (
            <div className="absolute top-[calc(100%+10px)] right-0 bg-white rounded-xl shadow-xl min-w-[240px] z-[1000] overflow-hidden animate-[dropdownFadeIn_0.2s_ease-out]">
              
              {/* Dropdown Header */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center text-xl font-semibold shrink-0">
                  {avatarLabel}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 truncate">
                    {user.displayName || user.username}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    @{user.username}
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-200" />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 font-medium hover:bg-red-50 transition-colors duration-200 cursor-pointer"
              >
                <span className="text-lg w-6 text-center">🚪</span>
                ログアウト
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
export default Header
