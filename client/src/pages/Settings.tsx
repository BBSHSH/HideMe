import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { F } from "../theme/tokens";
import { Icon } from "../components/Icon";
import { useTheme, useColors } from "../context/ThemeContext";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";

// ─── Toggle ────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const C = useColors();
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 48, height: 26, borderRadius: 13, flexShrink: 0,
      background: checked ? C.primaryContainer : C.surfaceVariant,
      position: "relative", cursor: "pointer", transition: "background 0.2s",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: checked ? "#fff" : C.outline,
        position: "absolute", top: 3,
        left: checked ? 25 : 3,
        transition: "left 0.2s, background 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
}

// ─── Segmented ─────────────────────────────────────────────
function Seg<T extends string | number>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  const C = useColors();
  return (
    <div style={{ display: "flex", background: C.surfaceVariant, borderRadius: 10, padding: 3, gap: 2 }}>
      {options.map((o) => (
        <button key={String(o.value)} onClick={() => onChange(o.value)} style={{
          padding: "5px 12px", borderRadius: 7, border: "none",
          background: value === o.value ? C.primaryContainer : "transparent",
          color: value === o.value ? C.onPrimaryContainer : C.outline,
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          transition: "all 0.15s", fontFamily: F.family,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ─── SettingItem ───────────────────────────────────────────
function SettingItem({ icon, label, desc, children, accent = false }: {
  icon: string; label: string; desc?: string; children: React.ReactNode; accent?: boolean;
}) {
  const C = useColors();
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, padding: "14px 0",
      borderBottom: `1px solid ${C.outlineVariant}22`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: accent ? "rgba(248,113,113,0.12)" : C.overlay10,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={17} style={{ color: accent ? "#f87171" : C.primary }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.onSurface }}>{label}</p>
          {desc && <p style={{ margin: "1px 0 0", fontSize: 11, color: C.outline }}>{desc}</p>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────
function Card({ icon, title, color = "#5865f2", children }: {
  icon: string; title: string; color?: string; children: React.ReactNode;
}) {
  const C = useColors();
  return (
    <div style={{
      background: C.surfaceContainer,
      border: `1px solid ${C.outlineVariant}33`,
      borderRadius: 20,
      overflow: "hidden",
    }}>
      {/* カードヘッダー */}
      <div style={{
        padding: "16px 20px",
        background: `linear-gradient(135deg, ${color}18 0%, transparent 60%)`,
        borderBottom: `1px solid ${C.outlineVariant}22`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={19} style={{ color }} />
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.onSurface }}>{title}</h3>
      </div>
      {/* カードボディ */}
      <div style={{ padding: "0 20px" }}>
        {children}
        {/* 最後のボーダーを消す */}
        <div style={{ height: 4 }} />
      </div>
    </div>
  );
}

// ─── テーマ選択（ビジュアル） ──────────────────────────────
function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const C = useColors();
  const options = [
    {
      value: "dark" as const,
      label: "ダーク",
      icon: "dark_mode",
      preview: ["#12131b", "#1f1f27", "#bec2ff"],
    },
    {
      value: "light" as const,
      label: "ライト",
      icon: "light_mode",
      preview: ["#f0f1f8", "#ffffff", "#3d4de8"],
    },
  ];
  return (
    <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
      {options.map((o) => (
        <div
          key={o.value}
          onClick={() => setTheme(o.value)}
          style={{
            flex: 1, borderRadius: 12, overflow: "hidden", cursor: "pointer",
            border: `2px solid ${theme === o.value ? C.primaryContainer : C.outlineVariant + "44"}`,
            transition: "border 0.2s",
          }}
        >
          {/* カラープレビュー */}
          <div style={{
            height: 52, display: "flex",
            background: o.preview[0],
            alignItems: "center", justifyContent: "center", gap: 4,
            padding: "8px 10px",
          }}>
            <div style={{ flex: 1, height: 28, borderRadius: 6, background: o.preview[1] }} />
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: o.preview[2], flexShrink: 0 }} />
          </div>
          {/* ラベル */}
          <div style={{
            padding: "8px 10px", background: C.surfaceContainerLow,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={o.icon} size={14} style={{ color: C.primary }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.onSurface }}>{o.label}</span>
            </div>
            {theme === o.value && (
              <Icon name="check_circle" size={15} style={{ color: C.primaryContainer }} filled />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── アカウントカード ──────────────────────────────────────
function AccountCard() {
  const C = useColors();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.primaryContainer}22 0%, ${C.surfaceContainer} 50%)`,
      border: `1px solid ${C.outlineVariant}33`,
      borderRadius: 20,
      padding: "20px",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
        background: `${C.primaryContainer}33`,
        border: `2px solid ${C.primaryContainer}66`,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {user?.avatar
          ? <img src={user.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <Icon name="person" size={28} style={{ color: C.primary }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.onSurface }}>{user?.username}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
            background: user?.role === "admin" ? `${C.primaryContainer}33` : `${C.outlineVariant}33`,
            color: user?.role === "admin" ? C.primary : C.outline,
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            {user?.role === "admin" ? "管理者" : "メンバー"}
          </span>
          <span style={{ fontSize: 11, color: C.outline }}>
            {user?.auth_method === "discord" ? "Discord" : "パスワード"}
          </span>
        </div>
      </div>
      {confirm ? (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setConfirm(false)} style={{
            padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.outlineVariant}44`,
            background: "transparent", color: C.outline, fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: F.family,
          }}>キャンセル</button>
          <button onClick={() => { logout(); navigate("/login"); }} style={{
            padding: "6px 12px", borderRadius: 8,
            border: "1px solid rgba(248,113,113,0.4)",
            background: "rgba(248,113,113,0.12)", color: "#f87171",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F.family,
          }}>ログアウト</button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} style={{
          padding: "8px 16px", borderRadius: 10,
          border: `1px solid ${C.outlineVariant}44`,
          background: C.surfaceVariant, color: C.onSurfaceVariant,
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F.family,
          display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
        }}>
          <Icon name="logout" size={16} />
          ログアウト
        </button>
      )}
    </div>
  );
}

// ─── メイン ──────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const C = useColors();
  const { settings, update, reset } = useSettings();
  const [resetConfirm, setResetConfirm] = useState(false);
  const [inputDevices,  setInputDevices]  = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devs) => {
      setInputDevices( devs.filter((d) => d.kind === "audioinput"));
      setOutputDevices(devs.filter((d) => d.kind === "audiooutput"));
    }).catch(() => {});
  }, []);

  return (
    <div style={{
      flex: 1, minHeight: 0, overflowY: "auto",
      padding: "28px 36px",
      background: C.background, color: C.onSurface,
      fontFamily: F.family, boxSizing: "border-box",
    }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{
          width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.outlineVariant}44`,
          background: C.surfaceContainer, color: C.onSurfaceVariant,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
        }}>
          <Icon name="arrow_back" size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>設定</h1>
          <p style={{ margin: "1px 0 0", fontSize: 12, color: C.outline }}>アプリの表示・動作をカスタマイズ</p>
        </div>
      </div>

      {/* アカウント */}
      <div style={{ marginBottom: 20 }}>
        <AccountCard />
      </div>

      {/* グリッドレイアウト */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}>

        {/* テーマ */}
        <Card icon="palette" title="テーマ・外観" color="#818cf8">
          <div style={{ paddingTop: 12, paddingBottom: 8 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: C.outline, fontWeight: 600 }}>カラーモード</p>
            <ThemeSelector />
          </div>
          <SettingItem icon="animation" label="アニメーション" desc="UIトランジション効果">
            <Toggle checked={settings.animationsEnabled} onChange={(v) => update("animationsEnabled", v)} />
          </SettingItem>
          <SettingItem icon="compress" label="コンパクトモード" desc="余白を減らしてより多くの情報を表示">
            <Toggle checked={settings.compactMode} onChange={(v) => update("compactMode", v)} />
          </SettingItem>
        </Card>

        {/* 表示設定 */}
        <Card icon="grid_view" title="表示設定" color="#34d399">
          <SettingItem icon="crop_square" label="コレクションカードサイズ" desc="コレクション一覧のカードの大きさ">
            <Seg
              options={[{ label: "小", value: "small" }, { label: "中", value: "medium" }, { label: "大", value: "large" }]}
              value={settings.collectionCardSize}
              onChange={(v) => update("collectionCardSize", v as any)}
            />
          </SettingItem>
        </Card>

        {/* プレイヤー＋アップロード */}
        <Card icon="play_circle" title="プレイヤー・アップロード" color="#f472b6">
          <div style={{ paddingTop: 14, paddingBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: "rgba(244,114,182,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="volume_up" size={17} style={{ color: "#f472b6" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.onSurface }}>デフォルト音量</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.outline }}>プレイヤーの初期音量</p>
                </div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#f472b6" }}>{settings.defaultVolume}%</span>
            </div>
            <input type="range" min={0} max={200} value={settings.defaultVolume}
              onChange={(e) => update("defaultVolume", Number(e.target.value))}
              style={{ width: "100%", accentColor: "#f472b6", marginBottom: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.outlineVariant }}>
              <span>ミュート</span><span>100%</span><span>200%</span>
            </div>
          </div>
          <SettingItem icon="hd" label="デフォルト解像度" desc="エディターの初期解像度">
            <Seg
              options={[
                { label: "1080p", value: "1080p" },
                { label: "720p",  value: "720p"  },
                { label: "480p",  value: "480p"  },
                { label: "240p",  value: "240p"  },
              ]}
              value={settings.defaultResolution}
              onChange={(v) => update("defaultResolution", v as any)}
            />
          </SettingItem>
          <SettingItem icon="speed" label="デフォルトFPS" desc="エディターの初期フレームレート">
            <Seg
              options={[
                { label: "24fps", value: 24 },
                { label: "30fps", value: 30 },
                { label: "60fps", value: 60 },
              ]}
              value={settings.defaultFps}
              onChange={(v) => update("defaultFps", v as any)}
            />
          </SettingItem>
        </Card>

        {/* 通知 */}
        <Card icon="notifications" title="通知" color="#a78bfa">
          <SettingItem icon="cloud_done" label="アップロード完了通知" desc="ファイルのアップロードが完了したときにブラウザ通知">
            <Toggle checked={settings.uploadNotification} onChange={(v) => update("uploadNotification", v)} />
          </SettingItem>
        </Card>

        {/* チャット */}
        <Card icon="forum" title="チャット" color="#38bdf8">
          <SettingItem icon="notifications_active" label="メンション通知" desc="自分へのメンション時にブラウザ通知">
            <Toggle checked={settings.mentionNotification} onChange={(v) => update("mentionNotification", v)} />
          </SettingItem>
          <SettingItem icon="volume_off" label="サーバーをミュート" desc="このサーバーの通知をすべてオフ">
            <Toggle checked={settings.muteServer} onChange={(v) => update("muteServer", v)} />
          </SettingItem>
          <SettingItem icon="record_voice_over" label="メッセージプレビュー" desc="通知にメッセージ内容を表示">
            <Toggle checked={settings.messagePreview} onChange={(v) => update("messagePreview", v)} />
          </SettingItem>
          <SettingItem icon="mark_chat_read" label="既読を自動送信" desc="チャンネルを開いたときに既読を送信">
            <Toggle checked={settings.autoReadMessages} onChange={(v) => update("autoReadMessages", v)} />
          </SettingItem>
        </Card>

        {/* 音声設定 */}
        <Card icon="headset_mic" title="音声設定" color="#fb923c">
          {/* 入力デバイス */}
          <div style={{ padding: "12px 0", borderBottom: `1px solid ${C.outlineVariant}22` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(251,146,60,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="mic" size={17} style={{ color: "#fb923c" }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.onSurface }}>マイク（入力）</p>
                <p style={{ margin: 0, fontSize: 11, color: C.outline }}>使用するマイクデバイス</p>
              </div>
            </div>
            <select value={settings.inputDeviceId} onChange={(e) => update("inputDeviceId", e.target.value)}
              style={{ width: "100%", background: C.surfaceVariant, border: `1px solid ${C.outlineVariant}44`,
                borderRadius: 8, padding: "8px 10px", color: C.onSurface, fontSize: 12,
                fontFamily: F.family, outline: "none", cursor: "pointer" }}>
              <option value="default">デフォルト</option>
              {inputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `マイク ${d.deviceId.slice(0, 8)}`}</option>
              ))}
            </select>
          </div>
          {/* 出力デバイス */}
          <div style={{ padding: "12px 0", borderBottom: `1px solid ${C.outlineVariant}22` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(251,146,60,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="headphones" size={17} style={{ color: "#fb923c" }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.onSurface }}>スピーカー（出力）</p>
                <p style={{ margin: 0, fontSize: 11, color: C.outline }}>使用するスピーカーデバイス</p>
              </div>
            </div>
            <select value={settings.outputDeviceId} onChange={(e) => update("outputDeviceId", e.target.value)}
              style={{ width: "100%", background: C.surfaceVariant, border: `1px solid ${C.outlineVariant}44`,
                borderRadius: 8, padding: "8px 10px", color: C.onSurface, fontSize: 12,
                fontFamily: F.family, outline: "none", cursor: "pointer" }}>
              <option value="default">デフォルト</option>
              {outputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `スピーカー ${d.deviceId.slice(0, 8)}`}</option>
              ))}
            </select>
          </div>
          {/* 入力音量 */}
          <div style={{ paddingTop: 12, paddingBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(251,146,60,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="volume_up" size={17} style={{ color: "#fb923c" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.onSurface }}>入力音量</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.outline }}>マイクの感度</p>
                </div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fb923c" }}>{settings.inputVolume}%</span>
            </div>
            <input type="range" min={0} max={200} value={settings.inputVolume}
              onChange={(e) => update("inputVolume", Number(e.target.value))}
              style={{ width: "100%", accentColor: "#fb923c" }} />
          </div>
          <SettingItem icon="noise_cancellation" label="ノイズ抑制" desc="背景ノイズを自動的に除去">
            <Toggle checked={settings.noiseSuppression} onChange={(v) => update("noiseSuppression", v)} />
          </SettingItem>
          <SettingItem icon="surround_sound" label="エコーキャンセル" desc="自分の声が相手にエコーとして聞こえるのを防ぐ">
            <Toggle checked={settings.echoCancellation} onChange={(v) => update("echoCancellation", v)} />
          </SettingItem>
          <SettingItem icon="graphic_eq" label="音声検出（VAD）" desc="無音時はマイクをミュートして帯域を節約">
            <Toggle checked={settings.voiceActivityDetect} onChange={(v) => update("voiceActivityDetect", v)} />
          </SettingItem>
          <SettingItem icon="music_note" label="効果音" desc="メッセージ受信・通話着信などのサウンド">
            <Toggle checked={settings.soundEffects} onChange={(v) => update("soundEffects", v)} />
          </SettingItem>
        </Card>

        {/* リセット */}
        <Card icon="settings_backup_restore" title="データ管理" color="#f87171">
          <SettingItem icon="restore" label="設定をリセット" desc="すべての設定をデフォルトに戻します" accent>
            {resetConfirm ? (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setResetConfirm(false)} style={{
                  padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.outlineVariant}44`,
                  background: "transparent", color: C.outline,
                  fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: F.family,
                }}>キャンセル</button>
                <button onClick={() => { reset(); setResetConfirm(false); }} style={{
                  padding: "5px 12px", borderRadius: 7,
                  border: "1px solid rgba(248,113,113,0.4)",
                  background: "rgba(248,113,113,0.12)", color: "#f87171",
                  fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: F.family,
                }}>リセット</button>
              </div>
            ) : (
              <button onClick={() => setResetConfirm(true)} style={{
                padding: "6px 16px", borderRadius: 8, border: `1px solid ${C.outlineVariant}44`,
                background: C.surfaceVariant, color: C.onSurfaceVariant,
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F.family,
              }}>リセット</button>
            )}
          </SettingItem>
        </Card>

      </div>
    </div>
  );
}
