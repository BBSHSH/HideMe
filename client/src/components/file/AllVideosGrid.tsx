/**
 * AllVideosGrid — 全コレクションの動画をVideoPlayerGridで表示するコンポーネント
 * /file/videos の Recent Activity で使用
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../../theme/tokens";
import VideoPlayerGrid from "./VideoPlayerGrid";
import { formatBytes, formatRelativeTime } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";
import { deleteCollectionFile } from "../../api/collections";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];

interface RecentFile {
  id: string;
  collection_id: string;
  collection_name: string;
  file_name: string;
  file_size: number;
  thumbnail_name: string;
  uploaded_by: string;
  uploader_name: string;
  uploader_avatar: string;
  uploaded_at: string;
}

const CARD_MIN_WIDTH = 200;
const GAP = 16;

export default function AllVideosGrid() {
  const [files, setFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsPerRow, setItemsPerRow] = useState(6);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // コンテナ幅から1行に収まるカード数を計算
  useEffect(() => {
    if (!containerRef.current) return;
    const calc = () => {
      const w = containerRef.current!.offsetWidth;
      const cols = Math.max(1, Math.floor((w + GAP) / (CARD_MIN_WIDTH + GAP)));
      setItemsPerRow(cols);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
    fetch(`${BASE_URL}/v1/all-files`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        const all: RecentFile[] = Array.isArray(d?.items) ? d.items : [];
        // 動画のみフィルタ
        setFiles(
          all.filter((f) => VIDEO_EXTS.some((ext) => f.file_name.toLowerCase().endsWith(ext)))
        );
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (fileId: string, _uploadedBy: string) => {
    if (!user) return;
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    if (!confirm("このファイルを削除しますか？")) return;
    try {
      await deleteCollectionFile(file.collection_id, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (e: any) {
      const status = e?.message?.match(/\d+/)?.[0];
      if (status === "403") alert("削除権限がありません");
      else alert("削除に失敗しました");
    }
  };

  if (loading) return (
    <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>読み込み中...</div>
  );
  if (files.length === 0) return (
    <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>動画ファイルはまだありません</div>
  );

  // VideoPlayerGrid が期待する VideoCardData 形式に変換
  const videoCards = files.map((f, i) => ({
    id: i,
    title: f.file_name.replace(/\.[^.]+$/, ""),
    channel: f.uploader_name || f.collection_name || "Unknown",
    views: formatBytes(f.file_size),
    time: formatRelativeTime(f.uploaded_at),
    duration: "—",
    imgSrc: "",
    avatarSrc: f.uploader_avatar || "",
    uploaderName: f.uploader_name || "Unknown",
    fileInfo: {
      fileName:   f.file_name,
      fileSize:   f.file_size,
      fileId:     f.id,
      thumbnailName: f.thumbnail_name || "",
      uploadedBy: f.uploaded_by,
    },
  }));

  // 1行分だけに絞ってからグリッドに渡す
  const sliced = videoCards.slice(0, itemsPerRow);

  return (
    <div ref={containerRef} style={{ overflow: "hidden" }}>
      <VideoPlayerGrid
        videos={sliced}
        onVideoClick={(video) => {
          if (video.fileInfo?.fileId) navigate(`/file/video/${video.fileInfo.fileId}`);
        }}
        onDelete={handleDelete}
        currentUserId={user?.userId}
        isAdmin={user?.role === "admin"}
        cardMinWidth={CARD_MIN_WIDTH}
      />
    </div>
  );
}
