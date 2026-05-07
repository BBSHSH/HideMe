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
        <header
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            left: "100px",
            height: "64px",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            background: "rgba(11,12,14,0.6)",
            backdropFilter: "blur(40px)",
            borderBottom: "1px solid rgba(88,101,242,0.2)",
            boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Search */}
          <div   style={{
            flex: 1,
            maxWidth: "448px",
            position: "relative",
            margin: "0 auto",
          }}>
            <span
              className="material-symbols-outlined"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "20px" }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="検索..."
              style={{
                width: "100%",
                backgroundColor: "rgba(30,41,59,0.4)",
                border: "1px solid rgba(88,101,242,0.1)",
                borderRadius: "8px",
                padding: "8px 16px 8px 40px",
                fontSize: "14px",
                color: "#e2e8f0",
                outline: "none",
              }}
            />
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", position: "relative" }}>
                <span className="material-symbols-outlined">notifications</span>
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                    border: "2px solid #0B0C0E",
                  }}
                />
              </button>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <span className="material-symbols-outlined">shield</span>
              </button>
            </div>
            <div style={{ width: "1px", height: "32px", backgroundColor: "rgba(88,101,242,0.2)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#e2e8f0" }}>管理者ユーザー</p>
                <p style={{ fontSize: "10px", color: "#64748b" }}>Tier 4 Clearance</p>
              </div>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "1px solid rgba(88,101,242,0.3)",
                  overflow: "hidden",
                }}
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuChBINZ9j9HBVgGFMzDCX95qswEqdNBjkHNV6h2Z2q7aSb-WTq3B4rxHA0zU7prK1zeVltYPH4FVjZH0qdMsLsQB4q-o7pwqD-ZUkKlgnjsM0OxU4DPVhJnjp9LVioL1rTQFQTaqm9VrURhg6aCppKYNgig1pyFhndyluLymv7_t9vC_XTHojqpkYhotXnbLBVSs7DMIMty2jCth21UaOa9eIDgxMyUQYhHUphOjz3iwvUyaMXyLj3xHIa1o9JhzaUkc70q1g8VS8P1"
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        </header>
  );
}
export default Header
