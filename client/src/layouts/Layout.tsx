import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { CallProvider } from '../context/CallContext'

export default function Layout() {
  const { logout } = useAuth()
  const isMobile = useIsMobile()
  const location = useLocation()
  const hideHeader = isMobile && location.pathname === "/file/shorts"

  return (
    <div className="min-h-screen bg-[#12131b] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background-color: #0B0C0E;
          background-image: radial-gradient(circle at 2px 2px, rgba(88,101,242,0.05) 1px, transparent 0);
          background-size: 24px 24px;
          font-family: 'Manrope', sans-serif;
          color: #e3e1ed;
        }
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%);
          box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        @keyframes pageIn {
          0%   { opacity: 0; transform: scale(0.98) translateY(4px); filter: blur(2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
        }
      `}</style>

      {!hideHeader && <Header onLogout={logout} />}

      <CallProvider>
        <main style={{ paddingTop: hideHeader ? 0 : isMobile ? 56 : 72 }}>
          <Outlet />
        </main>
      </CallProvider>
    </div>
  )
}