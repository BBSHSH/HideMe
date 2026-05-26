import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div style={{ backgroundColor: "#0B0C0E", color: "#e2e8f0", minHeight: "100vh", overflow: "hidden", fontFamily: "sans-serif" }} lang="ja">

      {/* TopAppBar */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "80px", zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px",
        background: "rgba(15,23,42,0.8)", backdropFilter: "blur(40px)",
        borderBottom: "1px solid rgba(88,101,242,0.2)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px", height: "40px", backgroundColor: "#3c4adb",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "8px", boxShadow: "0 0 15px rgba(88,101,242,0.4)",
          }}>
            <span className="material-symbols-outlined" style={{ color: "white", fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#5865F2", letterSpacing: "0.2em", textTransform: "uppercase", lineHeight: 1, margin: 0 }}>HideMe</h1>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "4px", marginBottom: 0 }}>Secure Perimeter</p>
          </div>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: "448px", padding: "0 48px" }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "rgba(30,41,59,0.5)", padding: "8px 16px",
            borderRadius: "8px", border: "1px solid rgba(88,101,242,0.2)",
          }}>
            <span className="material-symbols-outlined" style={{ color: "#94a3b8", marginRight: "8px", fontSize: "20px" }}>search</span>
            <input style={{
              background: "transparent", border: "none", outline: "none",
              fontSize: "14px", color: "#e2e8f0", width: "100%",
            }} placeholder="ファイルを検索..." type="text" />
          </div>
        </div>

        {/* Right Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[
              { icon: "dashboard", label: "Dash", active: false },
              { icon: "chat_bubble", label: "Chat", active: false },
              { icon: "folder_shared", label: "Storage", active: true },
              { icon: "video_settings", label: "Editor", active: false },
              { icon: "settings", label: "Config", active: false },
            ].map((item) => (
              <a key={item.label} href="#" style={{
                padding: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                color: item.active ? "#5865F2" : "#94a3b8", textDecoration: "none",
                borderBottom: item.active ? "2px solid #5865F2" : "2px solid transparent",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.05em" }}>{item.label}</span>
              </a>
            ))}
          </nav>

          <div style={{ width: "1px", height: "32px", backgroundColor: "#1e293b" }} />

          <button style={{
            backgroundColor: "#3c4adb", color: "white", padding: "8px 16px",
            borderRadius: "4px", fontWeight: 700, fontSize: "12px", letterSpacing: "-0.05em",
            display: "flex", alignItems: "center", gap: "8px",
            boxShadow: "0 4px 15px rgba(88,101,242,0.3)", border: "none", cursor: "pointer",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
            NEW PROJECT
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "16px" }}>
            <button style={{ padding: "8px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "rgba(88,101,242,0.2)", border: "1px solid rgba(88,101,242,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <span className="material-symbols-outlined" style={{ color: "#5865F2", fontSize: "20px" }}>account_circle</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: "flex", height: "100vh", paddingTop: "80px" }}>

        {/* Sidebar Left */}
        <aside style={{
          width: "288px", flexShrink: 0,
          background: "rgba(15,18,35,0.6)", backdropFilter: "blur(20px)",
          display: "flex", flexDirection: "column", padding: "24px",
          overflowY: "auto", borderRight: "1px solid rgba(88,101,242,0.1)",
        }}>
          {/* Storage Quota */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
              <h3 style={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Storage Status</h3>
              <span style={{ fontSize: "10px", color: "#5865F2", fontWeight: 700 }}>64% Full</span>
            </div>
            <div style={{ height: "8px", width: "100%", background: "rgba(30,41,59,0.5)", borderRadius: "9999px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ height: "100%", backgroundColor: "#5865F2", width: "64%", boxShadow: "0 0 10px rgba(88,101,242,0.5)" }} />
            </div>
            <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "8px", fontWeight: 500 }}>64.2 GB of 100 GB used</p>
          </div>

          {/* Pinned Files */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Pinned Intelligence</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {["Q3_financial_forecast.pdf", "operation_alpha_key.key"].map((name) => (
                <div key={name} style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "8px",
                  background: "rgba(30,41,59,0.3)", borderRadius: "4px",
                  border: "1px solid rgba(88,101,242,0.1)", cursor: "pointer",
                }}>
                  <span className="material-symbols-outlined" style={{ color: "#5865F2", fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Stream */}
          <div>
            <h3 style={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Activity Stream</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { dot: "#5865F2", title: "File Decrypted", sub: "security_protocol_v2.pdf", time: "2 mins ago" },
                { dot: "#475569", title: "New Folder Created", sub: "Classified_Archives", time: "45 mins ago" },
                { dot: "#475569", title: "Upload Complete", sub: "perimeter_scan_01.png", time: "3 hours ago" },
              ].map((item, i) => (
                <div key={i} style={{ position: "relative", paddingLeft: "16px", borderLeft: "1px solid rgba(88,101,242,0.2)" }}>
                  <div style={{
                    position: "absolute", left: "-4.5px", top: "4px",
                    width: "8px", height: "8px", borderRadius: "50%",
                    backgroundColor: item.dot,
                    boxShadow: item.dot === "#5865F2" ? "0 0 0 4px rgba(88,101,242,0.1)" : "none",
                  }} />
                  <p style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 700, margin: 0 }}>{item.title}</p>
                  <p style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", margin: "2px 0 0" }}>{item.sub}</p>
                  <p style={{ fontSize: "9px", color: "rgba(129,140,248,0.6)", marginTop: "4px" }}>{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1, padding: "32px", overflowY: "auto",
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(88,101,242,0.05) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(88,101,242,0.03) 0%, transparent 50%),
            #0a0c1a
          `,
        }}>
          {/* Breadcrumbs & Actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <nav style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500 }}>
              <a href="#" style={{ color: "#64748b", textDecoration: "none" }}>マイストレージ</a>
              <span className="material-symbols-outlined" style={{ color: "#475569", fontSize: "16px" }}>chevron_right</span>
              <a href="#" style={{ color: "#64748b", textDecoration: "none" }}>機密プロジェクト</a>
              <span className="material-symbols-outlined" style={{ color: "#475569", fontSize: "16px" }}>chevron_right</span>
              <span style={{ color: "#e2e8f0" }}>暗号化アセット</span>
            </nav>
            <div style={{ display: "flex", gap: "12px" }}>
              <button style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px",
                border: "1px solid rgba(88,101,242,0.3)", color: "#a5b4fc", fontSize: "14px",
                fontWeight: 600, background: "rgba(88,101,242,0.05)", cursor: "pointer",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>create_new_folder</span>
                新規フォルダ
              </button>
              <button style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px",
                backgroundColor: "#3c4adb", color: "white", fontSize: "14px",
                fontWeight: 700, border: "none", cursor: "pointer",
                boxShadow: "0 4px 15px rgba(88,101,242,0.3)",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>upload_file</span>
                ファイルをアップロード
              </button>
            </div>
          </div>

          {/* Vault Indicator */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(88,101,242,0.15)",
            backdropFilter: "blur(10px)", marginBottom: "32px", padding: "16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", inset: 0, backgroundColor: "#5865F2",
                  filter: "blur(8px)", opacity: 0.2,
                }} />
                <span className="material-symbols-outlined" style={{ color: "#5865F2", position: "relative", zIndex: 1, fontVariationSettings: "'FILL' 1" }}>lock</span>
              </div>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>セキュア・ヴォルト有効</h3>
                <p style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>AES-256軍事級暗号化プロトコル</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Integrity Check:</span>
              <span style={{ fontSize: "10px", color: "#4ade80", fontWeight: 900 }}>VALIDATED</span>
            </div>
          </div>

          {/* File Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px" }}>
            {/* Folder cards */}
            {[
              { name: "財務報告 2024", meta: "12 ファイル • 450 MB", icon: "folder", selected: false },
              { name: "法務ドキュメント", meta: "5 ファイル • 1.2 GB", icon: "folder", selected: false },
              { name: "security_protocol_v2.pdf", meta: "暗号化済み • 2.4 MB", icon: "encrypted", selected: true },
            ].map((item) => (
              <div key={item.name} style={{
                gridColumn: "span 4",
                background: "rgba(255,255,255,0.03)",
                border: item.selected ? "1px solid rgba(88,101,242,0.6)" : "1px solid rgba(88,101,242,0.15)",
                backdropFilter: "blur(10px)", padding: "24px", cursor: "pointer",
                boxShadow: item.selected ? "0 0 0 1px rgba(88,101,242,0.2)" : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <span className="material-symbols-outlined" style={{ color: "#5865F2", fontSize: "36px", fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  {item.selected
                    ? <div style={{ background: "rgba(88,101,242,0.2)", padding: "2px 8px", fontSize: "10px", color: "#5865F2", fontWeight: 700 }}>SELECTED</div>
                    : <span className="material-symbols-outlined" style={{ color: "#475569" }}>more_vert</span>
                  }
                </div>
                <h4 style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: "4px", fontSize: "14px" }}>{item.name}</h4>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{item.meta}</p>
              </div>
            ))}

            {/* Small file cards */}
            {[
              { icon: "image", name: "perimeter_scan_01.png", size: "1.8 MB" },
              { icon: "description", name: "employee_records.xlsx", size: "450 KB" },
              { icon: "description", name: "project_alpha_brief.docx", size: "12 MB" },
              { icon: "video_file", name: "cctv_feed_main_gate.mp4", size: "240 MB" },
            ].map((file) => (
              <div key={file.name} style={{
                gridColumn: "span 3",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(88,101,242,0.15)",
                backdropFilter: "blur(10px)", padding: "16px",
                display: "flex", alignItems: "center", gap: "12px", cursor: "pointer",
              }}>
                <span className="material-symbols-outlined" style={{ color: "#94a3b8" }}>{file.icon}</span>
                <div style={{ overflow: "hidden" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#cbd5e1", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                  <p style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", margin: 0 }}>{file.size}</p>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Sidebar Right */}
        <aside style={{
          width: "320px", flexShrink: 0,
          background: "rgba(15,18,35,0.6)", backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(88,101,242,0.1)",
          display: "flex", flexDirection: "column", overflowY: "auto",
        }}>
          <div style={{ padding: "24px", borderBottom: "1px solid rgba(88,101,242,0.1)" }}>
            <h2 style={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Inspector</h2>

            {/* Preview */}
            <div style={{
              aspectRatio: "16/9", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(88,101,242,0.2)", borderRadius: "4px",
              overflow: "hidden", position: "relative", marginBottom: "16px",
            }}>
              <img
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
                alt="preview"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT6_kPCBl0vFaycAI1_Y2Digr1Ilnu55IIY0r-w0HNMPCduuO85-pQUZxzDkhkMaZ7T5aev4p0tKoRzHKTdXe6C9HLB5kkxqdkIfqv3wCj7mMQexaY89_OEdj9anlydvSaCkAlpU4XPQRm-Y6cuFCGlNj5Qsd6mxZSKcQPf6uwDzgErH8cjhGKFTsRu2JpoJ8X5ebsHoUWlnFXcZfKc5SVHRDwKUCWGGPY9MJCE6_vj2babI3fpLdUDkqgKd1O4YZacrchWcFuO4n3"
              />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "rgba(88,101,242,0.5)" }}>verified_user</span>
              </div>
            </div>

            <h3 style={{ fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>security_protocol_v2.pdf</h3>
            <p style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "24px" }}>application / pdf</p>

            <div style={{ display: "flex", gap: "8px" }}>
              <button style={{
                flex: 1, backgroundColor: "#5865F2", color: "white", padding: "8px",
                fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.05em",
                border: "none", cursor: "pointer", boxShadow: "0 4px 10px rgba(88,101,242,0.3)",
              }}>ダウンロード</button>
              <button style={{ padding: "8px", border: "1px solid #334155", background: "none", cursor: "pointer", color: "#e2e8f0", borderRadius: "4px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>share</span>
              </button>
              <button style={{ padding: "8px", border: "1px solid #334155", background: "none", cursor: "pointer", color: "#f87171", borderRadius: "4px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
              </button>
            </div>
          </div>

          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Metadata */}
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>メタデータ</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "暗号化状態", value: "暗号化済み", valueColor: "#5865F2", icon: "check_circle" },
                  { label: "サイズ", value: "2.4 MB", valueColor: "#e2e8f0" },
                  { label: "最終更新", value: "2024/05/24 14:20", valueColor: "#e2e8f0" },
                  { label: "作成者", value: "Admin_X", valueColor: "#e2e8f0" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ color: "#94a3b8" }}>{row.label}</span>
                    <span style={{ color: row.valueColor, fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                      {row.icon && <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{row.icon}</span>}
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Log */}
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>セキュリティ・ログ</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { title: "完全性チェック完了", time: "2分前", accent: "#5865F2" },
                  { title: "アクセス権変更", time: "1時間前", accent: "#475569" },
                ].map((log) => (
                  <div key={log.title} style={{
                    background: "rgba(30,41,59,0.3)", padding: "8px",
                    borderLeft: `2px solid ${log.accent}`,
                  }}>
                    <p style={{ fontSize: "10px", color: "#e2e8f0", fontWeight: 700, margin: 0 }}>{log.title}</p>
                    <p style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", margin: 0 }}>{log.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;