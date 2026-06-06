import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { C, F } from "../theme/tokens";
import { Icon } from "../components/Icon";
import { useSettings } from "../context/SettingsContext";
import { uploadFileInChunks } from "../api/chunkUpload";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// 秒 → "mm:ss.s" フォーマット
function fmtTime(sec: number): string {
  if (!isFinite(sec)) return "0:00.0";
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

// ─── 型定義 ─────────────────────────────────────────────

type Resolution = "1080p" | "720p" | "480p" | "240p";
type FPS = 24 | 30 | 60;
type UploadPhase = "idle" | "encoding" | "sending" | "nas" | "done" | "error";

interface UploadProgress {
  phase: UploadPhase;
  encodingPercent: number; // クライアント ffmpeg.wasm エンコード
  sendPercent: number;     // クライアント → サーバー (XHR)
  nasPercent: number;      // サーバー → NAS (SSE)
  error?: string;
}

// ─── メインコンポーネント ───────────────────────────────

interface CollectionItem { ID: string; Name: string; }

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { file?: File; collectionId?: string } | null;

  const file = state?.file ?? null;
  const { settings } = useSettings();

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // トリム
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const draggingRef = useRef<"start" | "end" | null>(null);

  // 設定（SettingsContextのデフォルト値を使用）
  const [volume, setVolume] = useState(() => settings.defaultVolume);
  const [resolution, setResolution] = useState<Resolution>(() => settings.defaultResolution);
  const [fps, setFps] = useState<FPS>(() => settings.defaultFps);

  // ファイル名変更
  const [outputName, setOutputName] = useState(file?.name.replace(/\.[^.]+$/, "") ?? "");

  // コレクション選択
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [collectionId, setCollectionId] = useState(state?.collectionId ?? "");

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
    fetch(`${BASE_URL}/v1/collections`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        const items: CollectionItem[] = d?.items ?? [];
        setCollections(items);
        // collectionId が未設定なら最初のコレクションを選択
        if (!state?.collectionId && items.length > 0) {
          setCollectionId(items[0].ID);
        }
      })
      .catch(() => {});
  }, []);

  // 音量スライダー → プレビュー動画の音量にリアルタイム反映
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = Math.min(1, volume / 100);
    }
  }, [volume]);

  // アップロード進捗
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    phase: "idle",
    sendPercent: 0,
    encodingPercent: 0,
    nasPercent: 0,
  });
  const sseRef = useRef<EventSource | null>(null);

  // ─── 動画ロード ───
  // blob URL の生成と破棄を useEffect で一元管理する。
  // useMemo だと Strict Mode の二重レンダーで revoke 済みの URL を再利用してしまう。
  const [videoUrl, setVideoUrl] = useState<string>("");

  useEffect(() => {
    if (!file) {
      setVideoUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setTrimEnd(v.duration);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    // トリムエンドを超えたら止める
    if (v.currentTime >= trimEnd) {
      v.pause();
      v.currentTime = trimStart;
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
    } else {
      v.currentTime = Math.max(currentTime, trimStart);
      // play() は Promise を返す。中断エラーは握り潰す
      v.play().catch((err) => {
        if (err.name !== "AbortError") console.warn("play error:", err);
      });
      setIsPlaying(true);
    }
  };

  // ─── タイムライン ドラッグ ───

  const pxToSec = useCallback((px: number): number => {
    const el = timelineRef.current;
    if (!el || duration === 0) return 0;
    const ratio = Math.max(0, Math.min(1, px / el.clientWidth));
    return ratio * duration;
  }, [duration]);

  const startDrag = (handle: "start" | "end") => (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = handle;

    const onMove = (ev: MouseEvent) => {
      const el = timelineRef.current;
      if (!el || draggingRef.current === null) return;
      const rect = el.getBoundingClientRect();
      const sec = pxToSec(ev.clientX - rect.left);
      if (draggingRef.current === "start") {
        const clamped = Math.max(0, Math.min(sec, trimEnd - 0.1));
        setTrimStart(clamped);
        if (videoRef.current) videoRef.current.currentTime = clamped;
      } else {
        const clamped = Math.min(duration, Math.max(sec, trimStart + 0.1));
        setTrimEnd(clamped);
        if (videoRef.current) videoRef.current.currentTime = clamped;
      }
    };

    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // タイムラインクリックでシーク
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (draggingRef.current) return;
    const el = timelineRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sec = pxToSec(e.clientX - rect.left);
    if (videoRef.current) videoRef.current.currentTime = sec;
    setCurrentTime(sec);
  };

  // ─── アップロード ───

  /** Canvas でサムネイル生成 */
  const extractThumbnail = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const v = videoRef.current;
      if (!v) return resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 270;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(v, 0, 0, 480, 270);
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.75);
    });

  const handleUpload = async () => {
    if (!file || !collectionId || uploadProgress.phase !== 'idle') return;

    const uploadId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    const baseName = outputName.trim() || file.name.replace(/\.[^.]+$/, "");

    // SSE: サーバー側エンコード進捗 + NAS 転送進捗
    const sse = new EventSource(`${BASE_URL}/v1/upload-progress/${uploadId}`);
    sseRef.current = sse;
    sse.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data) as { phase: string; percent?: number; message?: string };
        if (d.phase === 'ffmpeg') {
          setUploadProgress((p) => ({ ...p, phase: 'encoding', encodingPercent: d.percent ?? 0 }));
        } else if (d.phase === 'nas') {
          setUploadProgress((p) => ({ ...p, phase: 'nas', encodingPercent: 100, nasPercent: d.percent ?? 0 }));
        } else if (d.phase === 'done') {
          setUploadProgress({ phase: 'done', encodingPercent: 100, sendPercent: 100, nasPercent: 100 });
          sse.close();
          if (settings.uploadNotification && Notification.permission === 'granted') {
            new Notification('アップロード完了', { body: file?.name ?? 'ファイルがアップロードされました' });
          } else if (settings.uploadNotification && Notification.permission === 'default') {
            Notification.requestPermission().then((p) => {
              if (p === 'granted') new Notification('アップロード完了', { body: file?.name ?? 'ファイルがアップロードされました' });
            });
          }
        } else if (d.phase === 'error') {
          setUploadProgress((p) => ({ ...p, phase: 'error', error: d.message ?? 'エラー' }));
          sse.close();
        }
      } catch {}
    };
    sse.onerror = () => sse.close();

    try {
      setUploadProgress({ phase: 'sending', sendPercent: 0, encodingPercent: 0, nasPercent: 0 });

      const renamedFile = new File([file], baseName + file.name.slice(file.name.lastIndexOf(".")), { type: file.type });

      // サムネイル生成（チャンクアップロード前に取得）
      void extractThumbnail(); // TODO: チャンクアップロード後にサムネイルを別送信

      // チャンクアップロード（5MB単位に分割してCloudflareの100MB制限を回避）
      const mergeRes = await uploadFileInChunks({
        file: renamedFile,
        collectionId,
        uploadId,
        trimStart,
        trimEnd,
        volume,
        resolution,
        fps,
        onSendProgress: (percent) => {
          setUploadProgress((p) => ({ ...p, phase: 'sending', sendPercent: percent }));
        },
      });

      if (!mergeRes.ok) {
        const b = await mergeRes.json().catch(() => ({}));
        throw new Error((b as { detail?: string; error?: string }).detail ?? (b as { error?: string }).error ?? `HTTP ${mergeRes.status}`);
      }

      setUploadProgress((p) => ({ ...p, sendPercent: 100 }));

    } catch (err) {
      setUploadProgress({
        phase: 'error', sendPercent: 0, encodingPercent: 0, nasPercent: 0,
        error: err instanceof Error ? err.message : 'エラーが発生しました',
      });
      sse.close();
    }
  };

  const handleBack = () => navigate(-1);

  // ─── スタイル ───

  const sidebarLabel = {
    fontSize: 11,
    fontWeight: 700 as const,
    color: "#5865F2",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    display: "flex",
    alignItems: "center",
    gap: 4,
  };

  // ─── ファイルがない場合 ───

  if (!file) {
    return (
      <div
        style={{
          height: "calc(100vh - 72px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          color: C.outlineVariant,
          fontFamily: F.family,
        }}
      >
        <Icon name="movie" size={64} style={{ opacity: 0.3 }} />
        <p>動画ファイルが選択されていません</p>
        <button
          onClick={handleBack}
          style={{
            padding: "10px 24px",
            borderRadius: 12,
            border: "none",
            background: C.primaryContainer,
            color: C.onPrimaryContainer,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: F.family,
          }}
        >
          戻る
        </button>
      </div>
    );
  }

  const startPct = duration > 0 ? (trimStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (trimEnd / duration) * 100 : 100;
  const playPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        height: "calc(100vh - 72px)",
        display: "flex",
        background: C.background,
        fontFamily: F.family,
        overflow: "hidden",
      }}
    >
      {/* ─── メインエリア ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* 戻るボタン */}
        <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleBack}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: "none", color: C.outlineVariant,
              cursor: "pointer", fontSize: 13, fontFamily: F.family,
            }}
          >
            <Icon name="arrow_back" size={18} />
            戻る
          </button>
          <span style={{ fontSize: 13, color: C.onSurfaceVariant, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.name}
          </span>
        </div>

        {/* ビデオプレビュー */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 900,
              aspectRatio: "16/9",
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <video
              ref={videoRef}
              src={videoUrl || undefined}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* オーバーレイコントロール */}
            <div
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)",
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                padding: 16,
              }}
            >
              {/* 時間表示 */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#bec2ff", fontWeight: 600 }}>
                  {fmtTime(currentTime)} / {fmtTime(duration)}
                </span>
                <span style={{ fontSize: 11, color: "#8f8fa0" }}>
                  トリム: {fmtTime(trimStart)} → {fmtTime(trimEnd)}
                </span>
              </div>

              {/* シークバー */}
              <div
                style={{ height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, marginBottom: 14, cursor: "pointer" }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  const sec = pct * duration;
                  if (videoRef.current) videoRef.current.currentTime = sec;
                }}
              >
                <div style={{ height: "100%", width: `${playPct}%`, background: "#5865F2", borderRadius: 2, position: "relative" }}>
                  <div style={{ position: "absolute", right: -5, top: -4, width: 12, height: 12, background: "#5865F2", borderRadius: "50%", border: "2px solid #fff" }} />
                </div>
              </div>

              {/* 再生コントロール */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
                <button
                  onClick={() => { if (videoRef.current) videoRef.current.currentTime = trimStart; }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", opacity: 0.8 }}
                >
                  <Icon name="skip_previous" size={28} />
                </button>
                <button
                  onClick={togglePlay}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}
                >
                  <Icon name={isPlaying ? "pause_circle" : "play_circle"} size={48} filled />
                </button>
                <button
                  onClick={() => { if (videoRef.current) videoRef.current.currentTime = trimEnd - 0.1; }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", opacity: 0.8 }}
                >
                  <Icon name="skip_next" size={28} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── トリムタイムライン ─── */}
        <div
          style={{
            flexShrink: 0,
            padding: "12px 24px 16px",
            background: "rgba(13,14,22,0.8)",
            borderTop: "1px solid rgba(69,70,85,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <Icon name="content_cut" size={16} style={{ color: "#5865F2" }} />
            <span style={{ fontSize: 11, color: "#5865F2", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              トリム
            </span>
            <span style={{ fontSize: 11, color: "#8f8fa0", marginLeft: "auto" }}>
              選択範囲: {fmtTime(trimEnd - trimStart)}
            </span>
          </div>

          {/* タイムライン本体 */}
          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            style={{
              position: "relative",
              height: 56,
              background: "#0d0e16",
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              border: "1px solid rgba(69,70,85,0.3)",
              userSelect: "none",
            }}
          >
            {/* 選択外 (暗くする) */}
            <div style={{ position: "absolute", left: 0, top: 0, width: `${startPct}%`, height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1 }} />
            <div style={{ position: "absolute", right: 0, top: 0, width: `${100 - endPct}%`, height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1 }} />

            {/* 選択範囲ハイライト */}
            <div
              style={{
                position: "absolute",
                left: `${startPct}%`,
                width: `${endPct - startPct}%`,
                top: 0, bottom: 0,
                background: "rgba(88,101,242,0.15)",
                borderTop: "2px solid #5865F2",
                borderBottom: "2px solid #5865F2",
                zIndex: 2,
              }}
            />

            {/* 再生ヘッド */}
            <div
              style={{
                position: "absolute",
                left: `${playPct}%`,
                top: 0, bottom: 0,
                width: 2,
                background: "#5865F2",
                zIndex: 4,
                boxShadow: "0 0 6px rgba(88,101,242,0.8)",
              }}
            />

            {/* 開始ハンドル */}
            <div
              onMouseDown={startDrag("start")}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                left: `${startPct}%`,
                top: 0, bottom: 0,
                width: 12,
                background: "#5865F2",
                cursor: "col-resize",
                zIndex: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "translateX(-6px)",
              }}
            >
              <div style={{ width: 2, height: 20, background: "#fff", borderRadius: 1 }} />
            </div>

            {/* 終了ハンドル */}
            <div
              onMouseDown={startDrag("end")}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                left: `${endPct}%`,
                top: 0, bottom: 0,
                width: 12,
                background: "#5865F2",
                cursor: "col-resize",
                zIndex: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "translateX(-6px)",
              }}
            >
              <div style={{ width: 2, height: 20, background: "#fff", borderRadius: 1 }} />
            </div>

            {/* 時間ラベル */}
            <div
              style={{
                position: "absolute", bottom: 4, left: 0, right: 0,
                display: "flex", justifyContent: "space-between",
                padding: "0 8px", fontSize: 9, color: "#454655",
                zIndex: 3, pointerEvents: "none",
              }}
            >
              <span>0:00</span>
              <span>{fmtTime(duration * 0.25)}</span>
              <span>{fmtTime(duration * 0.5)}</span>
              <span>{fmtTime(duration * 0.75)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── サイドバー ─── */}
      <aside
        style={{
          width: 280,
          background: "rgba(18,19,27,0.95)",
          borderLeft: "1px solid rgba(69,70,85,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── ファイル名 ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={sidebarLabel}>
              <Icon name="edit" size={16} />
              ファイル名
            </h3>
            <input
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder="ファイル名（拡張子不要）"
              style={{
                background: "rgba(26,27,35,0.8)",
                border: "1px solid rgba(69,70,85,0.4)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#e3e1ed",
                fontSize: 13,
                fontFamily: F.family,
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <p style={{ margin: 0, fontSize: 10, color: "#454655" }}>
              出力: {(outputName.trim() || file?.name.replace(/\.[^.]+$/, "") || "")}.mp4
            </p>
          </section>

          {/* ── コレクション ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={sidebarLabel}>
              <Icon name="folder" size={16} />
              アップロード先
            </h3>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              style={{
                background: "rgba(26,27,35,0.8)",
                border: "1px solid rgba(69,70,85,0.4)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#e3e1ed",
                fontSize: 13,
                fontFamily: F.family,
                outline: "none",
                width: "100%",
                cursor: "pointer",
              }}
            >
              {collections.length === 0 && <option value="">コレクションがありません</option>}
              {collections.map((col) => (
                <option key={col.ID} value={col.ID}>{col.Name}</option>
              ))}
            </select>
          </section>

          {/* ── 音量 ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={sidebarLabel}>
              <Icon name="volume_up" size={16} />
              音量調整
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range" min={0} max={200} value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#5865F2" }}
              />
              <div
                style={{
                  width: 52, textAlign: "center",
                  background: "rgba(41,41,50,0.6)",
                  border: "1px solid rgba(69,70,85,0.2)",
                  borderRadius: 6, padding: "4px 0",
                  fontSize: 12, fontWeight: 700, color: C.onSurface,
                }}
              >
                {volume}%
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#454655" }}>
              <span>0%</span><span>100%</span><span>200%</span>
            </div>
          </section>

          {/* ── 解像度 ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={sidebarLabel}>
              <Icon name="hd" size={16} />
              画質
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {(["1080p", "720p", "480p", "240p"] as Resolution[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  style={{
                    padding: "8px 0",
                    borderRadius: 8,
                    border: `1px solid ${resolution === r ? "#5865F2" : "rgba(69,70,85,0.3)"}`,
                    background: resolution === r ? "rgba(88,101,242,0.15)" : "rgba(26,27,35,0.8)",
                    color: resolution === r ? "#bec2ff" : C.onSurfaceVariant,
                    fontSize: 12, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {r}
                  {r === "720p" && <span style={{ fontSize: 9, opacity: 0.7 }}> (推奨)</span>}
                </button>
              ))}
            </div>
          </section>

          {/* ── フレームレート ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={sidebarLabel}>
              <Icon name="speed" size={16} />
              フレームレート
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {([24, 30, 60] as FPS[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  style={{
                    padding: "8px 0",
                    borderRadius: 8,
                    border: `1px solid ${fps === f ? "#5865F2" : "rgba(69,70,85,0.3)"}`,
                    background: fps === f ? "rgba(88,101,242,0.15)" : "rgba(26,27,35,0.8)",
                    color: fps === f ? "#bec2ff" : C.onSurfaceVariant,
                    fontSize: 12, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </section>

          {/* ── アップロード進捗 ── */}
          {uploadProgress.phase !== "idle" && (
            <UploadProgressPanel progress={uploadProgress} />
          )}
        </div>

        {/* ── アップロードボタン ── */}
        <div
          style={{
            padding: 16,
            borderTop: "1px solid rgba(69,70,85,0.2)",
            background: "rgba(13,14,22,0.8)",
          }}
        >
          {uploadProgress.phase === "done" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#4ade80", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                ✓ アップロード完了
              </div>
              <button
                onClick={handleBack}
                style={{
                  width: "100%", padding: "12px 0",
                  background: C.primaryContainer, color: C.onPrimaryContainer,
                  border: "none", borderRadius: 8, fontWeight: 700,
                  fontSize: 14, cursor: "pointer", fontFamily: F.family,
                }}
              >
                コレクションに戻る
              </button>
            </div>
          ) : uploadProgress.phase === "error" ? (
            <div>
              <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>
                {uploadProgress.error}
              </div>
              <button
                onClick={() => setUploadProgress({ phase: "idle", sendPercent: 0, encodingPercent: 0, nasPercent: 0 })}
                style={{
                  width: "100%", padding: "12px 0",
                  background: "rgba(248,113,113,0.15)", color: "#f87171",
                  border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8,
                  fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: F.family,
                }}
              >
                再試行
              </button>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              disabled={uploadProgress.phase !== "idle"}
              style={{
                width: "100%", padding: "16px 0",
                background: uploadProgress.phase !== "idle" ? "rgba(88,101,242,0.3)" : "#5865F2",
                color: "#fff",
                border: "none", borderRadius: 8, fontWeight: 700,
                fontSize: 15, cursor: uploadProgress.phase !== "idle" ? "not-allowed" : "pointer",
                fontFamily: F.family, transition: "all 0.2s",
                boxShadow: uploadProgress.phase === "idle" ? "0 0 20px rgba(88,101,242,0.4)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Icon name="cloud_upload" size={20} />
              アップロード
            </button>
          )}

          <p style={{ fontSize: 9, textAlign: "center", color: C.outline, marginTop: 6 }}>
            {collectionId ? `Collection: ${collectionId.slice(0, 8)}...` : "コレクションが未選択"}
          </p>
        </div>
      </aside>
    </div>
  );
}

// ─── アップロード進捗パネル ───────────────────────────────

function UploadProgressPanel({ progress }: { progress: UploadProgress }) {
  // 処理順: 送信 → エンコード(サーバー) → NAS転送
  const steps: { key: UploadPhase; label: string; percent: number }[] = [
    { key: "sending",  label: "サーバーへ送信中",        percent: progress.sendPercent },
    { key: "encoding", label: "エンコード中 (サーバー)", percent: progress.encodingPercent },
    { key: "nas",      label: "NASへ転送中",             percent: progress.nasPercent },
  ];

  const activeIdx =
    progress.phase === "sending"  ? 0 :
    progress.phase === "encoding" ? 1 :
    progress.phase === "nas"      ? 2 : 2;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`
        @keyframes indeterminate {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
      <h3 style={{
        fontSize: 11, fontWeight: 700, color: "#5865F2",
        textTransform: "uppercase", letterSpacing: "0.08em",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        <Icon name="cloud_upload" size={16} />
        アップロード状況
      </h3>

      {steps.map((step, i) => {
        const isDone   = i < activeIdx || progress.phase === "done";
        const isActive = i === activeIdx && progress.phase !== "done";
        const pct      = isDone ? 100 : isActive ? step.percent : 0;
        // progress イベントが来ない間は不定幅アニメーションで「動いている」ことを示す
        const isIndeterminate = isActive && pct === 0;

        return (
          <div key={step.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: isDone ? "#4ade80" : isActive ? "#bec2ff" : "#454655" }}>
                {isDone ? "✓ " : isActive ? "● " : "○ "}
                {step.label}
              </span>
              <span style={{ fontSize: 10, color: "#8f8fa0" }}>
                {isIndeterminate ? "処理中..." : `${Math.round(pct)}%`}
              </span>
            </div>
            <div style={{ height: 3, background: "rgba(69,70,85,0.3)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
              {isIndeterminate ? (
                // 不定幅スクロールアニメーション
                <div style={{
                  position: "absolute", left: 0, top: 0, height: "100%", width: "25%",
                  background: "#5865F2",
                  boxShadow: "0 0 8px rgba(88,101,242,0.8)",
                  animation: "indeterminate 1.4s ease-in-out infinite",
                }} />
              ) : (
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: isDone ? "#4ade80" : "#5865F2",
                  transition: "width 0.3s ease",
                  boxShadow: isActive ? "0 0 6px rgba(88,101,242,0.6)" : "none",
                }} />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
