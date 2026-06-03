import React, { useState } from 'react';

export default function HideMeApp() {
  // 状態管理
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  // カテゴリデータ
  const categories = [
    { label: 'All', active: true },
    { label: 'Valorant', active: false },
    { label: 'Overwatch', active: false },
    { label: 'Minecraft', active: false },
    { label: 'Tutorials', active: false },
    { label: 'Security Logs', active: false },
    { label: 'Cryptography', active: false },
    { label: 'Live', active: false },
  ];

  // ビデオデータ
  const videoCards = [
    {
      id: 1,
      title: "Valorant Ace - S6 Ranked Match Highlight",
      channel: "GhostOps Gaming",
      views: "1.2M views",
      time: "2 hours ago",
      duration: "10:42",
      badge: { type: "SECURE", icon: "verified_user", style: { background: "rgba(74, 222, 128, 0.2)", color: "#4ade80", borderColor: "rgba(74, 222, 128, 0.4)" } },
      imgSrc: "https://lh3.googleusercontent.com/aida-public/AB6AXuB08z0GAX_Uf8UJcc7GIzdzy11tZh9Xmw4Dh5IDO4OgafYPye5NFgmAan3cT1s4NRqgcXlso0rMnsjU7w7kt1AEyvL9Dom2s4Y0KDX15SsYEBxkHVAZW287-k7tqMc4rjqCLvexK0L9JSidMPiXp-XUt8spFnJXZ2SWzDvWsSqIWFYPi7SNsBV16M-wfSnml2LOXkDixnLmBSotDeGaN4_ITPVKIw6D5O97izDXKMszZxCnPj1s6hgj3ELZTB9UJjss8dCMcSoinGbC",
      avatarSrc: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgO09Mvp3Tanir-X8stJF2BNkVEE7N8vMNIytfaKM8uc7QL1BPhYxYnDK-026123hDeVtl5Lr5itYU3p1FIPUAKOt-rpINoTxvr77ouwaYmqOqpvbS-PLt9d5yntEkC46eBuABbnodNB_dhCc_Px2AQLLAhUx-pdImO5WBz_tRxgTKdRs4pcQq5CoICpP5ntB75_IqiKATi3zde_9oTBlkiktHFZSwplWkBJS2lOjiGyWLDWwLSde-DEq4JHywk-v-CPM-hjXjFdx4",
    },
    {
      id: 2,
      title: "Encryption Protocol Explained: RSA vs AES",
      channel: "CyberShield Network",
      views: "450K views",
      time: "5 hours ago",
      duration: "24:15",
      badge: { type: "SECURE", icon: "verified_user", style: { background: "rgba(74, 222, 128, 0.2)", color: "#4ade80", borderColor: "rgba(74, 222, 128, 0.4)" } },
      imgSrc: "https://lh3.googleusercontent.com/aida-public/AB6AXuANnTbC83WHKfH-GVJK0PDDXeyyRAy9VdyiJhnOh16o_J5j678fHxDQgVLBDemTuWzqxgfnDe663FHpqe2WOdR_u0fC2M-4mc69DRxgl0r0QW7-NVK0enl3XWkFiSZ-FBhoUc24KeKtPmu_tF3lpQnnzHEaKjlldtia29I3zJ05WYyMra9f7FxSjvJW3B24w7TimQtLBAA6FS48NUSrnIBx4ffSHwvMhocEZKTPCXotYXNIuiR8Ll-Ph7G6uZ_M1XuN2SlZ7pFoPhEJ",
      avatarSrc: "https://lh3.googleusercontent.com/aida-public/AB6AXuAiR1FckkK8pnyj-KMeHo3izFEIoFFvGeeqInda9qqJHFNAHkCq36VDjEzEqH5p1lxtn70nOwupzjBj50WelTJIRCMV7y5IYqPDcctnUSWeNNUwWocxJLKxy2DadXayzQNzK52RV7XQteIQGoe0Y3UlsjkR6gLq1hntDcS79HYIHyWFWH3uAT050gNB6qzfSf8sawAn621WQOBJFKSD9hDfezc3uXzcOdASgeKJ-reFIBjuQH5oKevRguPtGpFaKEWozboEX6VPNCMf",
    },
  ];

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  };

  return (
    <div style={{
      fontFamily: "'Manrope', sans-serif",
      backgroundColor: '#12131B',
      color: '#e3e1ed',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      {/* 疑似クラスやプレースホルダー用のグローバルスタイル定義（親要素の中に配置） */}
      <style>{`
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .icon-filled { font-variation-settings: 'FILL' 1 !important; }
        input::placeholder { color: #c6c5d7; }
        .category-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '72px' }}>
        {/* Main Content */}
        <main style={{ flex: 1, marginLeft: '256px', padding: '16px 24px', boxSizing: 'border-box' }}>
          {/* Category Chips */}
          <div className="category-scroll" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
            {categories.map((cat, index) => (
              <button
                key={index}
                style={{
                  padding: '4px 16px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: cat.active ? 'none' : '1px solid rgba(190, 194, 255, 0.1)',
                  background: cat.active ? '#5865f2' : 'rgba(31, 31, 39, 0.4)',
                  color: cat.active ? '#fffdff' : '#c6c5d7',
                  backdropFilter: cat.active ? undefined : 'blur(20px)',
                  boxShadow: cat.active ? '0 10px 20px rgba(88, 101, 242, 0.2)' : 'none',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Video Grid */}
          <div style={gridStyle}>
            {videoCards.map((card) => {
              const isHovered = hoveredCardId === card.id;
              return (
                <div
                  key={card.id}
                  onMouseEnter={() => setHoveredCardId(card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Thumbnail (Vault Glow) */}
                  <div style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    aspectRatio: '16 / 9',
                    marginBottom: '8px',
                    background: 'rgba(31, 31, 39, 0.4)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isHovered ? 'rgba(190, 194, 255, 0.3)' : 'rgba(190, 194, 255, 0.1)'}`,
                    boxShadow: isHovered ? '0 0 35px rgba(88, 101, 242, 0.4)' : '0 0 20px rgba(88, 101, 242, 0.15)',
                    transition: 'all 0.3s ease',
                  }}>
                    <img
                      src={card.imgSrc}
                      alt={card.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.5s ease',
                      }}
                    />
                    <div style={{
                      position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(18, 19, 27, 0.8)',
                      backdropFilter: 'blur(6px)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                      color: '#bec2ff', border: '1px solid rgba(190, 194, 255, 0.2)'
                    }}>{card.duration}</div>
                    
                    {card.badge && (
                      <div style={{
                        position: 'absolute', top: '8px', left: '8px', backdropFilter: 'blur(6px)', padding: '2px 8px',
                        borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid',
                        ...card.badge.style
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{card.badge.icon}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>{card.badge.type}</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: '#33343d', border: '1px solid rgba(69, 70, 85, 0.2)', overflow: 'hidden' }}>
                      <img src={card.avatarSrc} alt="Channel avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{
                        fontSize: '16px', fontWeight: 700, color: isHovered ? '#bec2ff' : '#e3e1ed', margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        transition: 'color 0.2s'
                      }}>{card.title}</h3>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#c6c5d7', margin: '4px 0 0 0' }}>{card.channel}</p>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#8f8fa0', margin: '2px 0 0 0' }}>
                        {card.views} {card.time && `• ${card.time}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}