import { useState } from "react";
import { useUpload } from "../../context/UploadContext";
import type { UploadJob } from "../../context/UploadContext";
import { C } from "../../theme/tokens";

function phaseLabel(job: UploadJob): string {
  switch (job.phase) {
    case "webcodecs": return `ブラウザエンコード中... ${Math.round(job.encodingPercent)}%`;
    case "sending":   return `送信中... ${job.sendPercent}%`;
    case "encoding":  return `エンコード中... ${job.encodingPercent}%`;
    case "nas":       return `保存中... ${job.nasPercent}%`;
    case "done":      return "完了";
    case "error":     return `エラー: ${job.error ?? "失敗"}`;
  }
}

function phasePercent(job: UploadJob): number {
  switch (job.phase) {
    case "webcodecs": return Math.round(job.encodingPercent * 0.4);
    case "sending":  return 40 + Math.round(job.sendPercent * 0.3);
    case "encoding": return 40 + Math.round(job.encodingPercent * 0.4);
    case "nas":      return 80 + Math.round(job.nasPercent * 0.2);
    case "done":     return 100;
    case "error":    return 0;
  }
}

function phaseColor(job: UploadJob): string {
  if (job.phase === "done")  return "#22c55e";
  if (job.phase === "error") return "#f87171";
  return C.primary;
}

function JobRow({ job }: { job: UploadJob }) {
  const { dismissJob } = useUpload();
  const pct = phasePercent(job);
  const color = phaseColor(job);
  const isDone = job.phase === "done" || job.phase === "error";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, animation: "jobRowIn 0.25s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* アイコン */}
        <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6,
          background: isDone ? `${color}22` : "rgba(88,101,242,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color }}>
            {job.phase === "done" ? "check_circle" : job.phase === "error" ? "error" : "upload"}
          </span>
        </div>
        {/* ファイル名 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.onSurface,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {job.fileName}
          </p>
          <p style={{ margin: "1px 0 0", fontSize: 10, color: isDone ? color : C.onSurfaceVariant }}>
            {phaseLabel(job)}
          </p>
        </div>
        {/* 閉じるボタン（完了・エラーのみ） */}
        {isDone && (
          <button onClick={() => dismissJob(job.id)} style={{
            flexShrink: 0, width: 20, height: 20, borderRadius: 4,
            border: "none", background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.onSurfaceVariant,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
          </button>
        )}
      </div>

      {/* プログレスバー */}
      {!isDone && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: `linear-gradient(90deg, #5865f2, #7c3aed)`,
            borderRadius: 2, transition: "width 0.4s ease",
          }} />
        </div>
      )}
    </div>
  );
}

export default function UploadProgressPanel() {
  const { jobs, dismissDone } = useUpload();
  const [collapsed, setCollapsed] = useState(false);

  if (jobs.length === 0) return null;

  const activeCount = jobs.filter(j => j.phase !== "done" && j.phase !== "error").length;
  const doneCount = jobs.filter(j => j.phase === "done").length;

  return (
    <>
      <style>{`
        @keyframes uploadPanelIn {
          0%   { opacity: 0; transform: translateY(32px) scale(0.94); }
          60%  { opacity: 1; transform: translateY(-4px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes jobRowIn {
          0%   { opacity: 0; transform: translateX(12px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      width: 320,
      background: "rgba(18,19,27,0.95)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      overflow: "hidden",
      animation: "uploadPanelIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      {/* ヘッダー */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "10px 14px", gap: 8,
        borderBottom: collapsed ? "none" : "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* 展開ボタン（左端） */}
        <button onClick={() => setCollapsed(v => !v)} style={{
          flexShrink: 0, width: 24, height: 24, borderRadius: 6, border: "none",
          background: "transparent", color: C.onSurfaceVariant,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {collapsed ? "expand_less" : "expand_more"}
          </span>
        </button>

        {/* タイトル（中央） */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          {activeCount > 0 && (
            <div style={{ width: 8, height: 8, borderRadius: "50%",
              background: C.primary, animation: "pulse 1.5s infinite", flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 12, fontWeight: 800, color: C.onSurface }}>
            {activeCount > 0
              ? `アップロード中 ${activeCount}件`
              : `完了 ${doneCount}件`}
          </span>
        </div>

        {/* ×ボタン（右端、完了時のみ） */}
        {doneCount > 0 && activeCount === 0 && (
          <button onClick={dismissDone} style={{
            flexShrink: 0, width: 24, height: 24, borderRadius: 6, border: "none",
            background: "transparent", color: C.onSurfaceVariant,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
          </button>
        )}
      </div>

      {/* ジョブリスト */}
      {!collapsed && (
        <div style={{ maxHeight: 320, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
          {jobs.map(job => <JobRow key={job.id} job={job} />)}
        </div>
      )}
    </div>
    </>
  );
}
