import { Icon } from "../../components/Icon";
import { C, F } from "../../theme/tokens";
import type { CSSProperties, ReactNode } from "react";

const ACCENT = C.primaryContainer;

type DotColor = "indigo" | "slate" | "red";

type ActivityItem = {
  dotColor: DotColor;
  timeLabel: string;
  content: ReactNode;
};

const dotMeta: Record<DotColor, { bg: string; shadow?: string; timeColor: string }> = {
  indigo: { bg: "#6366f1",                                          timeColor: "#64748b" },
  slate:  { bg: "#475569",                                          timeColor: "#64748b" },
  red:    { bg: "#ef4444", shadow: "0 0 8px rgba(239,68,68,0.5)", timeColor: "#f87171" },
};

const feedItems: ActivityItem[] = [
  {
    dotColor: "indigo",
    timeLabel: "たった今",
    content: (
      <>
        <span style={{ fontWeight: "bold", color: "white" }}>管理者</span> が新プロジェクト{" "}
        <span style={{ color: "#818cf8" }}>"Void"</span> を作成しました。
      </>
    ),
  },
  {
    dotColor: "slate",
    timeLabel: "24分前",
    content: (
      <>
        <span style={{ fontWeight: "bold", color: "white" }}>User_829</span> が{" "}
        <span style={{ color: "#818cf8" }}>Vault A</span> にアクセスしました。
      </>
    ),
  },
  {
    dotColor: "red",
    timeLabel: "1時間前",
    content: (
      <>
        <span style={{ fontWeight: "bold", color: "#fecaca", textDecoration: "underline" }}>
          不正アクセス警告:
        </span>{" "}
        IP 192.168.1.105 がブロックされました。
      </>
    ),
  },
  {
    dotColor: "slate",
    timeLabel: "3時間前",
    content: <>ストレージ最適化が完了しました。</>,
  },
];

const labelSm: CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

export function ActivityFeed() {
  return (
    <aside style={{ width: "320px" }}>
      <div
        style={{
          backgroundColor: "rgba(11,12,14,0.8)",
          backdropFilter: "blur(48px)",
          borderRadius: "8px",
          border: "1px solid rgba(88,101,242,0.2)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          position: "sticky",
          top: "88px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: "1px solid rgba(88,101,242,0.1)",
            paddingBottom: "16px",
          }}
        >
          <Icon name="history" style={{ color: ACCENT }} />
          <h3
            style={{
              ...(F.bodyMd as CSSProperties),
              fontWeight: 700,
              color: "#e2e8f0",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            アクティビティ・フィード
          </h3>
        </div>

        {/* Feed items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {feedItems.map((item, idx) => {
            const meta = dotMeta[item.dotColor];
            return (
              <div
                key={idx}
                style={{
                  position: "relative",
                  paddingLeft: "24px",
                  borderLeft: "2px solid rgba(88,101,242,0.2)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "-5px",
                    top: 0,
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: meta.bg,
                    boxShadow: meta.shadow,
                  }}
                />
                <p style={{ ...labelSm, color: meta.timeColor, marginBottom: "4px" }}>
                  {item.timeLabel}
                </p>
                <p style={{ fontSize: "14px", color: C.onSurfaceVariant, margin: 0 }}>
                  {item.content}
                </p>
              </div>
            );
          })}
        </div>

        {/* Infrastructure Card */}
        <div
          style={{
            backgroundColor: "#0f172a",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid rgba(88,101,242,0.1)",
            marginTop: "8px",
          }}
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCK5j-oKJGui26CvvrdZJnuHK5oYl80AWnn0XTvd30bCE6fEW2-htI5QTbdW_PAMSPRtLPRTLf7-ngUYaC_FlHIvgwrs4PnfGyL-zl6bZr7rR6a4EEyMqgQvRf8YnDX1o14tz0PA9nq4XZnQ5qhT-JAeKSSA5KGc7GTnKEfqDm3yFqBIdI63GH6Lej2Ty-fSOqbyO3JA6A-Fi7WrKJLQlhbBRQJ84wGTC-LZqcsQ8uK3rsNpDv7CNu9lUUcTUk1QjXpYMU3KCUOnQ2C"
            alt="Infrastructure"
            style={{
              width: "100%",
              height: "128px",
              objectFit: "cover",
              borderRadius: "4px",
              marginBottom: "12px",
              filter: "grayscale(1)",
              opacity: 0.5,
            }}
          />
          <p
            style={{
              ...(F.labelSm as CSSProperties),
              color: C.outline,
              lineHeight: 1.5,
              fontStyle: "italic",
              margin: 0,
            }}
          >
            インフラ監視システムが稼働中。現在の稼働率 99.99%。
          </p>
        </div>
      </div>
    </aside>
  );
}
export default ActivityFeed;