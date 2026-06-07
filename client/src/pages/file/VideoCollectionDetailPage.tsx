import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../../components/Icon";
import { getCollectionFiles, deleteCollectionFile } from "../../api/collections";
import { useCollections } from "../../hooks/useFiles";
import { useAuth } from "../../context/AuthContext";
import VideoPlayerGrid from "../../components/file/VideoPlayerGrid";
import FileUploadButton from "../../components/file/FileUploadButton";
import { formatBytes, formatRelativeTime } from "../../utils/format";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function getVideoDuration(url: string): Promise<string> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => resolve(fmtDuration(v.duration));
    v.onerror = () => resolve("—");
    setTimeout(() => resolve("—"), 5000);
  });
}

interface CollectionFile {
  id: string;
  file_name: string;
  file_size: number;
  thumbnail_name: string;
  uploaded_at: string;
  uploaded_by: string;
  uploader_name: string;
  uploader_avatar: string;
}

export default function VideoCollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { collections } = useCollections();
  const { user } = useAuth();
  const [files, setFiles] = useState<CollectionFile[]>([]);
  const [durations, setDurations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collection = collections.find((c) => c.ID === id);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await getCollectionFiles(id!);
        const filesData: CollectionFile[] = response?.items || [];
        const mp4Files = filesData.filter((f) =>
          f.file_name.toLowerCase().endsWith(".mp4")
        );
        setFiles(mp4Files);
        // 動画の長さを取得
        const durationMap: Record<string, string> = {};
        await Promise.all(mp4Files.map(async (f) => {
          const url = `${BASE_URL}/v1/files/${encodeURIComponent(f.file_name)}`;
          durationMap[f.id] = await getVideoDuration(url);
        }));
        setDurations(durationMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load files");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFiles();
  }, [id]);

  const videoCards = files.map((file, index) => ({
    id: index,
    title: file.file_name.replace(/\.mp4$/i, ""),
    channel: file.uploader_name || "Unknown",
    views: formatBytes(file.file_size),
    time: formatRelativeTime(file.uploaded_at),
    duration: durations[file.id] || "—",
    imgSrc: "",
    avatarSrc: file.uploader_avatar || "",
    uploaderName: file.uploader_name || "Unknown",
    fileInfo: {
      fileName: file.file_name,
      fileSize: file.file_size,
      fileId: file.id,
      thumbnailName: file.thumbnail_name || "",
      uploadedBy: file.uploaded_by,
    },
  }));

  const handleVideoClick = (video: any) => {
    navigate(`/file/video/${video.fileInfo?.fileId}`);
  };

  const handleDelete = async (fileId: string, uploadedBy: string) => {
    if (!user) return;
    if (user.role !== "admin" && user.userId !== uploadedBy) return;
    if (!confirm("このファイルを削除しますか？")) return;
    try {
      await deleteCollectionFile(id!, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (e) {
      alert("削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: C.outlineVariant }}>
        Loading collection...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#f87171" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: 48, display: "flex", flexDirection: "column", gap: 48, overflowY: "auto", flex: 1 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.outlineVariant }}>
            <span>Collections</span>
            <Icon name="chevron_right" size={14} style={{ color: C.outlineVariant }} />
            <span style={{ color: C.onSurface, fontWeight: 700 }}>
              {collection?.Name || "Video Collection"}
            </span>
          </nav>
          <h1 style={{ margin: 0, fontFamily: F.family, fontSize: 36, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.03em" }}>
            {collection?.Name || "Video Collection"}
          </h1>
          {collection?.Description && (
            <p style={{ margin: "8px 0 0", fontSize: 16, color: C.onSurfaceVariant }}>
              {collection.Description}
            </p>
          )}
        </div>

        {/* 動画専用アップロード */}
        <FileUploadButton
          collectionId={id!}
          fileType="video"
          onRefresh={() => window.location.reload()}
        />
      </div>

      {files.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: C.outlineVariant }}>
          No MP4 videos in this collection
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="video_library" style={{ color: C.primary }} />
            <span style={{ fontSize: 14, color: C.outlineVariant }}>
              {files.length} video{files.length !== 1 ? "s" : ""}
            </span>
          </div>

          <VideoPlayerGrid
            videos={videoCards}
            onVideoClick={handleVideoClick}
            onDelete={handleDelete}
            currentUserId={user?.userId}
            isAdmin={user?.role === "admin"}
          />
        </>
      )}
    </div>
  );
}
