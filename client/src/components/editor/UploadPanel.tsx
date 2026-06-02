export default function UploadPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#bec2ff",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
        >
          cloud_upload
        </span>
        アップロード状況
      </h3>

      <div
        style={{
          padding: 16,
          backgroundColor: "rgba(41,41,50,0.4)",
          borderRadius: 4,
          border: "1px solid rgba(69,70,85,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#e3e1ed",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              vault_stream_01_edit.mp4
            </p>

            <p style={{ fontSize: 10, color: "#8f8fa0" }}>
              処理中...
            </p>
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#bec2ff",
            }}
          >
            75%
          </span>
        </div>

        <div
          style={{
            height: 6,
            width: "100%",
            backgroundColor: "#34343d",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "75%",
              backgroundColor: "#bec2ff",
              boxShadow: "0 0 8px rgba(190,194,255,0.5)",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              padding: "2px 4px",
              backgroundColor: "rgba(190,194,255,0.2)",
              color: "#bec2ff",
              fontSize: 9,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Uploading
          </div>

          <span style={{ fontSize: 9, color: "#8f8fa0" }}>
            残り時間: 約45秒
          </span>
        </div>
      </div>
    </div>
  );
}