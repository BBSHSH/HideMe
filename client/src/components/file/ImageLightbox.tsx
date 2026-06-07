import { useEffect, useCallback } from "react";
import { Icon } from "../Icon";

interface ImageLightboxProps {
  src: string;
  name: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function ImageLightbox({
  src, name, onClose, onPrev, onNext, hasPrev, hasNext,
}: ImageLightboxProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape")     onClose();
    if (e.key === "ArrowLeft")  onPrev?.();
    if (e.key === "ArrowRight") onNext?.();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "lbIn 0.18s ease both",
      }}
    >
      <style>{`
        @keyframes lbIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lbImgIn { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
      `}</style>

      {/* ✕ 閉じる */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff", display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", zIndex: 10,
        }}
      >
        <Icon name="close" size={20} />
      </button>

      {/* ← 前へ */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", zIndex: 10,
          }}
        >
          <Icon name="chevron_left" size={26} />
        </button>
      )}

      {/* → 次へ */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          style={{
            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", zIndex: 10,
          }}
        >
          <Icon name="chevron_right" size={26} />
        </button>
      )}

      {/* 画像本体 */}
      <img
        src={src}
        alt={name}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "calc(100vw - 120px)",
          maxHeight: "calc(100vh - 80px)",
          objectFit: "contain",
          borderRadius: 8,
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
          animation: "lbImgIn 0.2s ease both",
        }}
      />

      {/* ファイル名 */}
      <p style={{
        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
        margin: 0, fontSize: 13, fontWeight: 600,
        color: "rgba(255,255,255,0.55)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        maxWidth: "calc(100vw - 120px)",
        pointerEvents: "none",
      }}>
        {name}
      </p>
    </div>
  );
}
