import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { C, F } from "../../theme/tokens";
import { useCollections } from "../../hooks/useFiles";
import { getCollectionFiles, recordView } from "../../api/collections";
import { formatRelativeTime } from "../../utils/format";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];

interface VideoFile {
  id: string;
  file_name: string;
  display_name: string;
  file_size: number;
  thumbnail_name: string;
  uploaded_at: string;
  uploader_name: string;
  uploader_avatar: string;
  collection_id: string;
  collection_name: string;
  color: string;
  view_count?: number;
}

function shuffleNoRepeat(arr: VideoFile[], lastId?: string): VideoFile[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (lastId && a.length > 1 && a[0].id === lastId) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}

export default function ShortsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { collections } = useCollections();
  const [allVideos, setAllVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collections.length) return;
    (async () => {
      let all: VideoFile[] = [];
      for (const col of collections) {
        const res = await getCollectionFiles(col.ID).catch(() => null);
        const items: VideoFile[] = (res?.items || [])
          .filter((f: VideoFile) => VIDEO_EXTS.some(e => f.file_name.toLowerCase().endsWith(e)))
          .map((f: VideoFile) => ({ ...f, collection_id: col.ID, collection_name: col.Name, color: col.Color || C.primary }));
        all = [...all, ...items];
      }
      setAllVideos(all);
      setLoading(false);
    })();
  }, [collections]);

  const activeCol = searchParams.get("collection") || "all";
  const filtered = activeCol === "all" ? allVideos : allVideos.filter(v => v.collection_id === activeCol);

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      background: "#111", color: "rgba(255,255,255,0.4)", fontFamily: F.family }}>
      読み込み中...
    </div>
  );
  if (filtered.length === 0) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 12, background: "#111", color: "rgba(255,255,255,0.4)", fontFamily: F.family }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3 }}>play_circle</span>
      <p style={{ margin: 0 }}>動画はまだありません</p>
    </div>
  );

  return <ShortsPlayer videos={filtered} onBack={() => navigate("/file/videos")} />;
}

// ── ビデオのオーバーレイUI（動画要素なし）────────────────────────────────────
function VideoOverlay({
  video, muted, volume, playing, onTogglePlay, onToggleMute, onVolumeChange,
}: {
  video: VideoFile; muted: boolean; volume: number; playing: boolean;
  onTogglePlay: () => void; onToggleMute: () => void;
  onVolumeChange: (v: number) => void;
}) {
  const navigate = useNavigate();
  const [showVolume, setShowVolume] = useState(false);

  return (
    <>
      {!playing && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", pointerEvents: "none", zIndex: 2 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%",
            background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#fff" }}>pause</span>
          </div>
        </div>
      )}
      {/* 右サイドボタン */}
      <div style={{ position: "absolute", right: 12, bottom: 120, display: "flex",
        flexDirection: "column", gap: 20, alignItems: "center", zIndex: 20 }}>

        {/* 音量スライダー（縦） */}
        {showVolume && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              background: "rgba(0,0,0,0.65)", borderRadius: 20, padding: "10px 8px",
            }}
          >
            <style>{`
              .vol-slider { writing-mode: vertical-lr; direction: rtl; appearance: slider-vertical;
                width: 4px; height: 80px; cursor: pointer; accent-color: #fff; }
            `}</style>
            <input
              type="range" min={0} max={1} step={0.05}
              value={muted ? 0 : volume}
              onChange={e => onVolumeChange(Number(e.target.value))}
              className="vol-slider"
            />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
              {muted ? 0 : Math.round(volume * 100)}
            </span>
          </div>
        )}

        <button
          onClick={e => { e.stopPropagation(); setShowVolume(v => !v); onToggleMute(); }}
          style={{ background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
            width: 48, height: 48, cursor: "pointer", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            {muted || volume === 0 ? "volume_off" : volume < 0.5 ? "volume_down" : "volume_up"}
          </span>
        </button>
        <button onClick={() => navigate(`/file/video/${video.id}`)}
          style={{ background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
            width: 48, height: 48, cursor: "pointer", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>open_in_full</span>
        </button>
      </div>
      {/* 下部メタ情報 */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
        padding: "48px 16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #5865f2, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {video.uploader_avatar
              ? <img src={video.uploader_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{(video.uploader_name || "?")[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff" }}>{video.uploader_name || "Unknown"}</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{formatRelativeTime(video.uploaded_at)}</p>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
          {video.display_name || video.file_name.replace(/\.[^.]+$/, "")}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: video.color || C.primary }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{video.collection_name}</span>
          {video.view_count != null && video.view_count > 0 && (
            <>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>·</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{video.view_count.toLocaleString()}回視聴</span>
            </>
          )}
        </div>
      </div>
      {/* タップで再生/停止 */}
      <div
        onClick={onTogglePlay}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      />
    </>
  );
}

// ── ShortsPlayer（3スロット常時レンダリング）─────────────────────────────────
function ShortsPlayer({ videos, onBack }: { videos: VideoFile[]; onBack: () => void }) {
  // キュー管理
  const [queue, setQueue] = useState<VideoFile[]>(() => shuffleNoRepeat(videos));
  const queueRef = useRef<VideoFile[]>([]);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  // 各スロットが担当するキューインデックス（-1=空）
  // スロット0=現在, スロット1=次, スロット2=前（初期）
  const [slotQIdx, setSlotQIdx] = useState<[number, number, number]>([
    0,
    queue.length > 1 ? 1 : -1,
    -1,
  ]);
  const slotQIdxRef = useRef(slotQIdx);
  useEffect(() => { slotQIdxRef.current = slotQIdx; }, [slotQIdx]);

  // 現在のスロット番号（0, 1, 2）
  const [curSlot, setCurSlot] = useState(0);
  const curSlotRef = useRef(0);
  useEffect(() => { curSlotRef.current = curSlot; }, [curSlot]);



  // 動画要素 ref（スロットごとに固定）
  const vRef0 = useRef<HTMLVideoElement>(null);
  const vRef1 = useRef<HTMLVideoElement>(null);
  const vRef2 = useRef<HTMLVideoElement>(null);
  const vRefs = [vRef0, vRef1, vRef2];

  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playing, setPlaying] = useState(true);

  // アニメーション状態
  const [animPhase, setAnimPhase] = useState<'idle' | 'run'>('idle');
  const [animDir, setAnimDir] = useState<'up' | 'down'>('up');
  const lockRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // スロットのキューインデックスが変わったとき、動画srcを命令的に更新
  // 非カレントスロットはプリロードのみ（pause + currentTime=0）
  useEffect(() => {
    slotQIdx.forEach((qIdx, slot) => {
      const el = vRefs[slot].current;
      if (!el) return;
      if (qIdx < 0 || qIdx >= queueRef.current.length) {
        el.pause();
        return;
      }
      const v = queueRef.current[qIdx];
      if (el.getAttribute("data-vid") !== v.id) {
        el.setAttribute("data-vid", v.id);
        el.src = `${BASE_URL}/v1/files/${encodeURIComponent(v.file_name)}`;
        if (v.thumbnail_name) {
          el.poster = `${BASE_URL}/v1/files/${encodeURIComponent(v.thumbnail_name)}`;
        } else {
          el.removeAttribute("poster");
        }
        el.muted = true; // 非表示スロットはミュートでプリロード
        el.currentTime = 0;
        // カレントスロットなら再生、それ以外はpauseのまま（プリロードのみ）
        if (slot === curSlotRef.current) {
          el.muted = muted;
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      }
    });
  }, [slotQIdx, queue]);

  // muted / volume 変更をカレントスロットにのみ反映（他はミュートのまま）
  useEffect(() => {
    vRefs.forEach((r, i) => {
      if (!r.current) return;
      r.current.muted = i === curSlot ? muted : true;
      if (i === curSlot) r.current.volume = volume;
    });
  }, [muted, volume, curSlot]);

  // playing 変更をカレントスロットに反映
  useEffect(() => {
    const el = vRefs[curSlot].current;
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  // curSlot が変わったとき: 旧スロット停止、新スロットを最初から再生
  const prevCurSlotRef = useRef(curSlot);
  useEffect(() => {
    const oldSlot = prevCurSlotRef.current;
    prevCurSlotRef.current = curSlot;
    if (oldSlot !== curSlot) {
      const oldEl = vRefs[oldSlot].current;
      if (oldEl) { oldEl.pause(); oldEl.muted = true; }
    }
    const el = vRefs[curSlot].current;
    if (el) {
      el.muted = muted;
      el.currentTime = 0;
      if (playing) el.play().catch(() => {});
    }
  }, [curSlot]);

  // キュー追加が必要か確認してスロットに割り当て
  const ensureNextSlotFilled = useCallback((afterCurQIdx: number, newNextSlot: number) => {
    const neededQIdx = afterCurQIdx + 1;
    if (neededQIdx < queueRef.current.length) {
      setSlotQIdx(prev => {
        const next = [...prev] as [number, number, number];
        next[newNextSlot] = neededQIdx;
        return next;
      });
    } else {
      // キューを延長
      const lastId = queueRef.current[queueRef.current.length - 1]?.id;
      const ext = shuffleNoRepeat(videos, lastId);
      setQueue(prev => {
        const newQ = [...prev, ...ext];
        queueRef.current = newQ;
        setSlotQIdx(prev2 => {
          const next = [...prev2] as [number, number, number];
          next[newNextSlot] = neededQIdx; // 延長後は有効
          return next;
        });
        return newQ;
      });
    }
  }, [videos]);

  const ensurePrevSlotFilled = useCallback((afterCurQIdx: number, newPrevSlot: number) => {
    const neededQIdx = afterCurQIdx - 1;
    setSlotQIdx(prev => {
      const next = [...prev] as [number, number, number];
      next[newPrevSlot] = neededQIdx >= 0 ? neededQIdx : -1;
      return next;
    });
  }, []);

  const doSlide = useCallback((dir: 'up' | 'down') => {
    if (lockRef.current) return;
    const cs = curSlotRef.current;
    const ns = (cs + 1) % 3; // next slot
    const ps = (cs + 2) % 3; // prev slot
    const sq = slotQIdxRef.current;

    if (dir === 'up' && sq[ns] < 0) return; // 次がない
    if (dir === 'down' && sq[ps] < 0) return; // 前がない

    lockRef.current = true;
    setAnimDir(dir);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setAnimPhase('run');
    }));

    setTimeout(() => {
      const newCurSlot = dir === 'up' ? ns : ps;
      const newCurQIdx = slotQIdxRef.current[newCurSlot];

      // 視聴カウント
      if (newCurQIdx >= 0 && newCurQIdx < queueRef.current.length) {
        const v = queueRef.current[newCurQIdx];
        recordView(v.collection_id, v.id).catch(() => {});
      }

      setCurSlot(newCurSlot);

      // 空いたスロット（old far slot）に次/前の動画を割り当て
      if (dir === 'up') {
        // old prevSlot が new nextSlot になる → nextQIdx を割り当て
        ensureNextSlotFilled(newCurQIdx, ps);
      } else {
        // old nextSlot が new prevSlot になる → prevQIdx を割り当て
        ensurePrevSlotFilled(newCurQIdx, ns);
      }

      setAnimPhase('idle');
      lockRef.current = false;
    }, 370);
  }, [ensureNextSlotFilled, ensurePrevSlotFilled]);

  const goNext = useCallback(() => doSlide('up'), [doSlide]);
  const goPrev = useCallback(() => doSlide('down'), [doSlide]);

  // videosが変わったら再初期化
  useEffect(() => {
    if (!videos.length) return;
    const q = shuffleNoRepeat(videos);
    setQueue(q);
    queueRef.current = q;
    setSlotQIdx([0, q.length > 1 ? 1 : -1, -1]);
    setCurSlot(0);
    // 動画要素をリセット
    vRefs.forEach(r => {
      if (r.current) r.current.removeAttribute("data-vid");
    });
  }, [videos.length]);

  // スワイプ検出
  const touchStartY = useRef(0);
  const goNextRef = useRef(goNext);
  const goPrevRef = useRef(goPrev);
  useEffect(() => { goNextRef.current = goNext; goPrevRef.current = goPrev; }, [goNext, goPrev]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      touchStartY.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
    };
    const onEnd = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (dy > 50) goNextRef.current();
      else if (dy < -50) goPrevRef.current();
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  // ホイール検出
  const wheelLock = useRef(false);
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (wheelLock.current) return;
    wheelLock.current = true;
    setTimeout(() => { wheelLock.current = false; }, 600);
    if (e.deltaY > 0) goNext();
    if (e.deltaY < 0) goPrev();
  }, [goNext, goPrev]);

  const togglePlay = () => setPlaying(p => !p);
  const toggleMute = () => setMuted(m => !m);
  const handleVolumeChange = (v: number) => {
    setVolume(v);
    setMuted(v === 0);
    vRefs.forEach((r, i) => {
      if (!r.current) return;
      if (i === curSlot) { r.current.volume = v; r.current.muted = v === 0; }
    });
  };

  // スロットの transform を計算
  // role: 0=current(0%), 1=next(100%), 2=prev(-100%)
  const TRANS = "transform 0.35s cubic-bezier(0.4,0,0.2,1)";
  const getTransform = (slot: number): string => {
    const role = (slot - curSlot + 3) % 3; // 0=current, 1=next, 2=prev
    const base = role === 0 ? 0 : role === 1 ? 100 : -100;
    if (animPhase === 'run') {
      const delta = animDir === 'up' ? -100 : 100;
      return `translateY(${base + delta}%)`;
    }
    return `translateY(${base}%)`;
  };

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden", background: "#111" }}
    >
      {/* 9:16 枠 */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
        margin: "auto",
        height: "100%", aspectRatio: "9/16", maxWidth: "100%",
        overflow: "hidden",
      }}>
        {([0, 1, 2] as const).map(slot => {
          const qIdx = slotQIdx[slot];
          const video = qIdx >= 0 && qIdx < queue.length ? queue[qIdx] : null;
          const isCurrent = slot === curSlot;
          const role = (slot - curSlot + 3) % 3; // 0=current,1=next,2=prev
          // アニメーション中に入ってくるスロット（オーバーレイを表示）
          const isIncoming = animPhase === 'run' && (
            (animDir === 'up' && role === 1) ||
            (animDir === 'down' && role === 2)
          );

          return (
            <div key={slot} style={{
              position: "absolute", inset: 0, background: "#000",
              transform: getTransform(slot),
              transition: animPhase === 'run' ? TRANS : 'none',
            }}>
              <video
                ref={vRefs[slot]}
                loop
                muted={muted}
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              {(isCurrent || isIncoming) && video && (
                <VideoOverlay
                  video={video}
                  muted={muted}
                  volume={volume}
                  playing={isCurrent ? playing : true}
                  onTogglePlay={togglePlay}
                  onToggleMute={toggleMute}
                  onVolumeChange={handleVolumeChange}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 戻るボタン（左上） */}
      <button onClick={onBack}
        style={{ position: "absolute", top: 16, left: 16,
          background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
          width: 40, height: 40, cursor: "pointer", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 30 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
      </button>
    </div>
  );
}
