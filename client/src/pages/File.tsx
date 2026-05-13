import { useState } from "react";

export default function File() {
  const [volume, setVolume] = useState(80);
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [resolution, setResolution] = useState("1080p (1920 x 1080)");

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        fontFamily: "'Manrope', sans-serif",
        color: "#e3e1ed",
        backgroundImage: "radial-gradient(rgba(190, 194, 255, 0.05) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <main style={{flex: 1, display: "flex", overflow: "hidden", marginLeft: "256px", marginTop: "40px", padding: "32px", minHeight: "100vh" }}>
        {/* Central Workspace */}
        <section style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#12131b", position: "relative", overflow: "hidden" }}>
          {/* Preview Player */}
          <div
            className="vault-gradient"
            style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24, alignItems: "center", justifyContent: "center" }}
          >
            <div
              className="glass-panel"
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 896,
                aspectRatio: "16/9",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3WWddb8Ac7UQ3jHGbkZKdU-GAkp6DISBGfUMuOEa_c0RothMqt_I1Y4-b3oLGYzdOCy2v89IRbDUPU2NIiIbJwN8Mr5rWnvZW9_pmd3qTK8TJ3Uq0H3TPXDfjYIJR-uiSOthb-Tzwqj-Y-fVfd4njI7bdSwHC4gUQviWNttBgcJeqSp5x6RY4SB_ecb8VuNoS1jTSQ8zOkUTB4nINxuZR_FiPZkzJRzs4xd0hA8tg29YJpTDKUQX807GDToN3vGz-AJiCfSzdXpKT"
                alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
              />
              {/* Hover Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: 16,
                  background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#bec2ff" }}>00:02:45 / 00:10:00</span>
                  <div style={{ display: "flex", gap: 16 }}>
                    {["settings", "fullscreen"].map((icon) => (
                      <span key={icon} className="material-symbols-outlined" style={{ color: "#e3e1ed", cursor: "pointer", fontSize: 20 }}>{icon}</span>
                    ))}
                  </div>
                </div>
                {/* Progress Bar */}
                <div style={{ height: 4, width: "100%", backgroundColor: "#34343d", borderRadius: 999, marginBottom: 16 }}>
                  <div style={{ height: "100%", width: "25%", backgroundColor: "#bec2ff", borderRadius: 999, position: "relative" }}>
                    <div style={{ position: "absolute", right: -6, top: -4, width: 12, height: 12, backgroundColor: "#bec2ff", borderRadius: "50%", border: "2px solid white", boxShadow: "0 0 8px rgba(190,194,255,0.5)" }} />
                  </div>
                </div>
                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 48 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#e3e1ed", cursor: "pointer" }}>skip_previous</span>
                  <span className="material-symbols-outlined fill-icon" style={{ fontSize: 48, color: "#e3e1ed", cursor: "pointer" }}>play_circle</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#e3e1ed", cursor: "pointer" }}>skip_next</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-panel" style={{ height: 192, borderTop: "1px solid rgba(69,70,85,0.2)", display: "flex", flexDirection: "column" }}>
            {/* Timeline Toolbar */}
            <div style={{ height: 40, borderBottom: "1px solid rgba(69,70,85,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", backgroundColor: "rgba(190,194,255,0.1)", border: "1px solid rgba(190,194,255,0.3)", borderRadius: 4, color: "#bec2ff", cursor: "pointer" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_cut</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>ここでカット</span>
                </button>
                <div style={{ width: 1, height: 16, backgroundColor: "rgba(69,70,85,0.4)", margin: "0 4px" }} />
                {["undo", "redo"].map((icon) => (
                  <span key={icon} className="material-symbols-outlined" style={{ color: "#c6c5d7", cursor: "pointer", fontSize: 20 }}>{icon}</span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: "#c6c5d7", fontSize: 18 }}>zoom_out</span>
                <input type="range" style={{ width: 128, height: 4, borderRadius: 999, backgroundColor: "#34343d" }} />
                <span className="material-symbols-outlined" style={{ color: "#c6c5d7", fontSize: 18 }}>zoom_in</span>
              </div>
            </div>

            {/* Timeline Track */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", backgroundColor: "#0d0e16", padding: 4 }}>
              {/* Ruler */}
              <div style={{ height: 24, display: "flex", borderBottom: "1px solid rgba(69,70,85,0.1)", fontSize: 10, color: "#454655", alignItems: "flex-end", paddingBottom: 4, overflow: "hidden" }}>
                {["00:00:00", "00:01:00", "00:02:00", "00:03:00", "00:04:00"].map((t, i) => (
                  <div key={t} style={{ flexShrink: 0, width: 128, borderRight: "1px solid rgba(69,70,85,0.2)", textAlign: "center", fontWeight: i === 3 ? 700 : 400, color: i === 3 ? "#bec2ff" : "#454655" }}>
                    {t}
                  </div>
                ))}
              </div>

              {/* Track */}
              <div style={{ flex: 1, paddingTop: 16, position: "relative" }}>
                <div style={{ height: 64, width: "100%", backgroundColor: "rgba(190,194,255,0.05)", border: "1px solid rgba(190,194,255,0.2)", borderRadius: 4, position: "relative", overflow: "hidden", display: "flex" }}>
                  {[0,1,2,3].map((i) => (
                    <div key={i} style={{ flex: 1, borderRight: "1px solid rgba(69,70,85,0.1)", opacity: 0.3 }} />
                  ))}
                  {/* Selected Clip */}
                  <div style={{ position: "absolute", left: 100, right: 250, top: 0, bottom: 0, backgroundColor: "rgba(190,194,255,0.3)", borderLeft: "2px solid #bec2ff", borderRight: "2px solid #bec2ff" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, backgroundColor: "#bec2ff", cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 2, height: 16, backgroundColor: "#000da4", borderRadius: 999 }} />
                    </div>
                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, backgroundColor: "#bec2ff", cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 2, height: 16, backgroundColor: "#000da4", borderRadius: 999 }} />
                    </div>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 16px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#bec2ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>SELECTED_RANGE.mp4</span>
                    </div>
                  </div>
                </div>
                {/* Playhead */}
                <div style={{ position: "absolute", left: 300, top: 0, bottom: 0, width: 2, backgroundColor: "#bec2ff", zIndex: 10, pointerEvents: "none" }}>
                  <div style={{ position: "absolute", top: -4, left: -5, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #bec2ff" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside
          style={{
            width: 288,
            backgroundColor: "rgba(26, 27, 35, 0.4)",
            backdropFilter: "blur(24px)",
            borderLeft: "1px solid rgba(69,70,85,0.2)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Volume */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: "#bec2ff", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>volume_up</span>
                音量調整
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  style={{ flex: 1, height: 4, borderRadius: 999 }}
                />
                <div style={{ position: "relative", width: 64 }}>
                  <input
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    style={{ width: "100%", backgroundColor: "#292932", border: "1px solid rgba(69,70,85,0.2)", borderRadius: 4, fontSize: 12, fontWeight: 600, padding: "4px 8px", textAlign: "center", color: "#e3e1ed", outline: "none" }}
                  />
                  <span style={{ position: "absolute", right: 8, top: 4, fontSize: 10, color: "#8f8fa0" }}>%</span>
                </div>
              </div>
            </div>

            {/* Quality Settings */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: "#bec2ff", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings_video_camera</span>
                画質設定
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 11, color: "#c6c5d7", display: "block" }}>解像度</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    style={{ width: "100%", backgroundColor: "#292932", border: "1px solid rgba(69,70,85,0.2)", borderRadius: 4, fontSize: 12, fontWeight: 600, padding: 8, color: "#e3e1ed", outline: "none" }}
                  >
                    <option>4K (3840 x 2160)</option>
                    <option>1080p (1920 x 1080)</option>
                    <option>720p (1280 x 720)</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 11, color: "#c6c5d7", display: "block" }}>フレームレート</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                    {([24, 30, 60] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFps(f)}
                        style={{
                          padding: "6px 0",
                          backgroundColor: fps === f ? "rgba(190,194,255,0.1)" : "rgba(26,27,35,0.8)",
                          border: `1px solid ${fps === f ? "rgba(190,194,255,0.4)" : "rgba(69,70,85,0.2)"}`,
                          color: fps === f ? "#bec2ff" : "#c6c5d7",
                          fontSize: 10,
                          borderRadius: 4,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {f} fps
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Status */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: "#bec2ff", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cloud_upload</span>
                アップロード状況
              </h3>
              <div style={{ padding: 16, backgroundColor: "rgba(41,41,50,0.4)", borderRadius: 4, border: "1px solid rgba(69,70,85,0.1)", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#e3e1ed", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      vault_stream_01_edit.mp4
                    </p>
                    <p style={{ fontSize: 10, color: "#8f8fa0" }}>処理中...</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#bec2ff" }}>75%</span>
                </div>
                <div style={{ height: 6, width: "100%", backgroundColor: "#34343d", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "75%", backgroundColor: "#bec2ff", boxShadow: "0 0 8px rgba(190,194,255,0.5)" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ padding: "2px 4px", backgroundColor: "rgba(190,194,255,0.2)", color: "#bec2ff", fontSize: 9, borderRadius: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Uploading
                  </div>
                  <span style={{ fontSize: 9, color: "#8f8fa0" }}>残り時間: 約45秒</span>
                </div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div style={{ padding: 16, backgroundColor: "rgba(26,27,35,0.6)", borderTop: "1px solid rgba(69,70,85,0.2)" }}>
            <button
              style={{
                width: "100%",
                padding: "16px 0",
                backgroundColor: "#bec2ff",
                color: "#000da4",
                fontWeight: 700,
                fontSize: 16,
                border: "none",
                borderRadius: 4,
                boxShadow: "0 0 20px rgba(88,101,242,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                transition: "transform 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            >
              <span className="material-symbols-outlined">enhanced_encryption</span>
              安全に書き出す
            </button>
            <p style={{ fontSize: 9, textAlign: "center", color: "#8f8fa0", marginTop: 8 }}>最終セーブ: 1分前</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
