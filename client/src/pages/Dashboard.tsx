const Dashboard = () => {
  const quickActions = [
    { icon: "add_to_photos", label: "新規チャンネル" },
    { icon: "upload_file", label: "アップロード" },
    { icon: "lock", label: "Vault 管理" },
    { icon: "person_add", label: "招待" },
  ];

  const recentFiles = [
    { icon: "encrypted", name: "project_alpha_v2.enc", meta: "2.4 MB • 12分前" },
    { icon: "policy", name: "security_audit_report.pdf", meta: "1.8 MB • 1時間前" },
    { icon: "database", name: "client_database_backup.sql", meta: "452 MB • 3時間前" },
  ];

  const activityFeed = [
    {
      dotColor: "bg-indigo-500",
      timeLabel: "たった今",
      timeColor: "text-slate-500",
      content: (
        <>
          <span className="font-bold text-white">管理者</span> が新プロジェクト{" "}
          <span className="text-indigo-400">"Void"</span> を作成しました。
        </>
      ),
    },
    {
      dotColor: "bg-slate-600",
      timeLabel: "24分前",
      timeColor: "text-slate-500",
      content: (
        <>
          <span className="font-bold text-white">User_829</span> が{" "}
          <span className="text-indigo-400">Vault A</span> にアクセスしました。
        </>
      ),
    },
    {
      dotColor: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
      timeLabel: "1時間前",
      timeColor: "text-red-400",
      content: (
        <>
          <span className="font-bold text-red-200 underline">不正アクセス警告:</span>{" "}
          IP 192.168.1.105 がブロックされました。
        </>
      ),
    },
    {
      dotColor: "bg-slate-600",
      timeLabel: "3時間前",
      timeColor: "text-slate-500",
      content: <>ストレージ最適化が完了しました。</>,
    },
  ];

  return (
    <>
      <div style={{ minHeight: "100vh" }}>
        {/* Main */}
        <main style={{ marginLeft: "256px", marginTop: "40px", padding: "32px", minHeight: "100vh" }}>
          <div style={{ display: "flex", gap: "32px" }}>
            {/* Left workspace */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "32px" }}>

              {/* Vault Status */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "24px",
                  backgroundColor: "rgba(88,101,242,0.05)",
                  border: "1px solid rgba(88,101,242,0.2)",
                  borderRadius: "8px",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ position: "relative" }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "36px", color: "#5865F2", fontVariationSettings: "'FILL' 1" }}
                    >
                      verified_user
                    </span>
                    <span
                      className="animate-pulse"
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        width: "12px",
                        height: "12px",
                        backgroundColor: "#818cf8",
                        borderRadius: "50%",
                      }}
                    />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "24px", fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>
                      セキュリティ・ペリメーター: 有効
                    </h2>
                    <p style={{ color: "#94a3b8", fontSize: "14px" }}>暗号化トンネルが正常に動作しています。</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["TLS 1.3 Active", "Zone: JP-E1"].map((tag, i) => (
                    <span
                      key={tag}
                      style={{
                        padding: "4px 12px",
                        backgroundColor: i === 0 ? "rgba(88,101,242,0.1)" : "#1e293b",
                        border: `1px solid ${i === 0 ? "rgba(88,101,242,0.3)" : "#334155"}`,
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: i === 0 ? "#818cf8" : "#94a3b8",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
                {/* Storage */}
                <div
                  className="glass-card"
                  style={{
                    backgroundColor: "rgba(30,41,59,0.6)",
                    padding: "24px",
                    borderRadius: "8px",
                    border: "1px solid rgba(88,101,242,0.2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                      使用ストレージ
                    </span>
                    <span className="material-symbols-outlined" style={{ color: "#818cf8" }}>cloud_done</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "30px", fontWeight: 800, color: "white" }}>842.5 GB</p>
                    <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>合計 2TB 中</p>
                  </div>
                  <div style={{ width: "100%", backgroundColor: "#0f172a", height: "4px", borderRadius: "9999px", overflow: "hidden" }}>
                    <div
                      style={{
                        backgroundColor: "#5865F2",
                        height: "100%",
                        width: "42%",
                        boxShadow: "0 0 10px rgba(88,101,242,0.8)",
                      }}
                    />
                  </div>
                </div>

                {/* Active Users */}
                <div
                  className="glass-card"
                  style={{
                    backgroundColor: "rgba(30,41,59,0.6)",
                    padding: "24px",
                    borderRadius: "8px",
                    border: "1px solid rgba(88,101,242,0.2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                      アクティブユーザー
                    </span>
                    <span className="material-symbols-outlined" style={{ color: "#818cf8" }}>group</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "30px", fontWeight: 800, color: "white" }}>12,490</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                      <span className="material-symbols-outlined" style={{ color: "#4ade80", fontSize: "16px" }}>trending_up</span>
                      <span style={{ fontSize: "12px", color: "#4ade80" }}>+12% vs 先週</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", height: "32px", gap: "4px" }}>
                    {[40, 60, 55, 80, 100].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: i === 4 ? "#5865F2" : `rgba(88,101,242,${0.2 + i * 0.05})`,
                          flex: 1,
                          height: `${h}%`,
                          borderRadius: "2px",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Peak Activity */}
                <div
                  className="glass-card"
                  style={{
                    backgroundColor: "rgba(30,41,59,0.6)",
                    padding: "24px",
                    borderRadius: "8px",
                    border: "1px solid rgba(88,101,242,0.2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                      ピークアクティビティ
                    </span>
                    <span className="material-symbols-outlined" style={{ color: "#818cf8" }}>bolt</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "30px", fontWeight: 800, color: "white" }}>4.2 GB/s</p>
                    <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>03:45 UTC に記録</p>
                  </div>
                  <svg width="100%" height="32" overflow="visible">
                    <path
                      d="M0 35 Q 25 35, 50 20 T 100 25 T 150 10 T 200 5"
                      fill="none"
                      stroke="#5865F2"
                      strokeWidth="2"
                    />
                    <circle className="animate-pulse" cx="200" cy="5" r="3" fill="#5865F2" />
                  </svg>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.2em",
                    marginBottom: "16px",
                  }}
                >
                  クイックアクション
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      className="glass-card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                        padding: "24px",
                        borderRadius: "8px",
                        border: "1px solid rgba(88,101,242,0.1)",
                        background: "none",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.border = "1px solid rgba(88,101,242,0.4)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(88,101,242,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.border = "1px solid rgba(88,101,242,0.1)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          backgroundColor: "#1e293b",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ color: "#818cf8" }}>{action.icon}</span>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#cbd5e1" }}>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Files */}
              <div
                className="glass-card"
                style={{
                  backgroundColor: "rgba(30,41,59,0.4)",
                  borderRadius: "8px",
                  border: "1px solid rgba(88,101,242,0.1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "24px",
                    borderBottom: "1px solid rgba(88,101,242,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h3 style={{ fontSize: "20px", fontWeight: 700, color: "white" }}>最近のファイル</h3>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#5865F2",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.1em",
                    }}
                  >
                    すべて表示
                  </button>
                </div>
                <div>
                  {recentFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: idx < recentFiles.length - 1 ? "1px solid rgba(88,101,242,0.05)" : "none",
                        transition: "background-color 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(88,101,242,0.05)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#0f172a",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(88,101,242,0.1)",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ color: "#818cf8" }}>{file.icon}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0" }}>{file.name}</p>
                          <p style={{ fontSize: "10px", color: "#64748b" }}>{file.meta}</p>
                        </div>
                      </div>
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}>
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Feed Sidebar */}
            <aside style={{ width: "320px" }}>
              <div
                className="glass-card"
                style={{
                  backgroundColor: "rgba(11,12,14,0.8)",
                  backdropFilter: "blur(48px)",
                  borderRadius: "8px",
                  border: "1px solid rgba(88,101,242,0.2)",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                  position: "sticky",
                  top: "88px",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderBottom: "1px solid rgba(88,101,242,0.1)",
                    paddingBottom: "16px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: "#5865F2" }}>history</span>
                  <h3 style={{ fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.02em" }}>アクティビティ・フィード</h3>
                </div>

                {/* Feed Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {activityFeed.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        paddingLeft: "24px",
                        borderLeft: "2px solid rgba(88,101,242,0.2)",
                      }}
                    >
                      <div
                        className={item.dotColor}
                        style={{
                          position: "absolute",
                          left: "-5px",
                          top: 0,
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor:
                            item.dotColor.includes("red") ? "#ef4444" :
                            item.dotColor.includes("indigo") ? "#6366f1" : "#475569",
                          boxShadow: item.dotColor.includes("red") ? "0 0 8px rgba(239,68,68,0.5)" : undefined,
                        }}
                      />
                      <p
                        style={{
                          fontSize: "10px",
                          color: item.timeColor.includes("red") ? "#f87171" : "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.1em",
                          marginBottom: "4px",
                        }}
                      >
                        {item.timeLabel}
                      </p>
                      <p style={{ fontSize: "14px", color: "#cbd5e1" }}>{item.content}</p>
                    </div>
                  ))}
                </div>

                {/* Infrastructure Card */}
                <div
                  style={{
                    backgroundColor: "#0f172a",
                    borderRadius: "8px",
                    padding: "16px",
                    border: "1px solid rgba(88,101,242,0.1)",
                    marginTop: "8px",
                  }}
                >
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCK5j-oKJGui26CvvrdZJnuHK5oYl80AWnn0XTvd30bCE6fEW2-htI5QTbdW_PAMSPRtLPRTLf7-ngUYaC_FlHIvgwrs4PnfGyL-zl6bZr7rR6a4EEyMqgQvRf8YnDX1o14tz0PA9nq4XZnQ5qhT-JAeKSSA5KGc7GTnKEfqDm3yFqBIdI63GH6Lej2Ty-fSOqbyO3JA6A-Fi7WrKJLQlhbBRQJ84wGTC-LZqcsQ8uK3rsNpDv7CNu9lUUcTUk1QjXpYMU3KCUOnQ2C"
                    alt="Infrastructure"
                    style={{
                      width: "100%",
                      height: "128px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      marginBottom: "12px",
                      filter: "grayscale(1)",
                      opacity: 0.5,
                    }}
                  />
                  <p style={{ fontSize: "10px", color: "#64748b", lineHeight: "1.5", fontStyle: "italic" }}>
                    インフラ監視システムが稼働中。現在の稼働率 99.99%。
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
