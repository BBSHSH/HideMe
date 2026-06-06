import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../../theme/tokens";
import { Icon } from "../Icon";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

function getToken(): string | null {
  const raw = localStorage.getItem("hideme_auth");
  return raw ? JSON.parse(raw).token : null;
}

interface FileUploadButtonProps {
  collectionId: string;
  accept?: string;
  fileType?: "video" | "image" | "all";
  onRefresh?: () => void;
}

const ALLOWED_EXTENSIONS = {
  video: [".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv", ".wmv"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  all: [],
};

const MIME_TYPES = {
  video: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  all: [],
};

const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv", ".wmv"];

export default function FileUploadButton({
  collectionId,
  accept,
  fileType = "all",
  onRefresh,
}: FileUploadButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const acceptAttr =
    accept ||
    (fileType === "all" ? undefined : ALLOWED_EXTENSIONS[fileType].join(","));

  const isVideoFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    return (
      VIDEO_EXTS.some((ext) => name.endsWith(ext)) ||
      file.type.startsWith("video/")
    );
  };

  const validateFile = (file: File): boolean => {
    if (fileType === "all") return true;
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS[fileType].some((ext) =>
      fileName.endsWith(ext)
    );
    const hasValidMimeType = MIME_TYPES[fileType].some((mime) =>
      file.type.startsWith(mime.split("/")[0])
    );
    if (!hasValidExtension && !hasValidMimeType) {
      setError(fileType === "video" ? "動画ファイルのみ対応しています" : "画像ファイルのみ対応しています");
      return false;
    }
    return true;
  };

  // 非動画ファイルを直接アップロード（all モード用）
  const uploadDirect = (file: File) => {
    setUploading(true);
    setProgress(0);

    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (xhr.status >= 200 && xhr.status < 300) {
        onRefresh?.();
      } else {
        setError(`アップロードに失敗しました (${xhr.status})`);
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setError("ネットワークエラー");
    };
    xhr.open("POST", `${BASE_URL}/v1/collections/${collectionId}/files`);
    xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);
    xhr.timeout = 600000;
    xhr.send(form);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (!validateFile(file)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 動画ファイルはエディター画面へ（トリミング・エンコード）
    if (isVideoFile(file)) {
      navigate("/editor", {
        state: { file, collectionId, onRefresh: null },
      });
      return;
    }

    // video モードで非動画が来た場合はエラー
    if (fileType === "video") {
      setError("動画ファイルを選択してください");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // all モードの非動画ファイルは直接アップロード
    uploadDirect(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 20px",
          borderRadius: 12,
          border: "none",
          background: uploading ? `${C.primary}4d` : C.primaryContainer,
          color: uploading ? C.outlineVariant : C.onPrimaryContainer,
          fontWeight: 800,
          fontSize: 15,
          fontFamily: F.family,
          cursor: uploading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}
      >
        <Icon name={uploading ? "hourglass_top" : "cloud_upload"} size={20} />
        <span>
          {uploading
            ? `アップロード中... ${progress}%`
            : fileType === "video"
            ? "動画をアップロード"
            : "ファイルをアップロード"}
        </span>
      </button>

      {uploading && (
        <div style={{ width: "100%", height: 4, background: C.surfaceVariant, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: C.primary, transition: "width 0.2s" }} />
        </div>
      )}

      {error && (
        <span style={{ color: "#f87171", fontSize: 13 }}>{error}</span>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
