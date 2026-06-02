import { Icon } from "../../components/Icon";
import { C, glassPanel } from "../../theme/tokens";
import type { CSSProperties } from "react";

const ACCENT   = C.primaryContainer;
const ACCENT_L = C.primary;

const glassCard: CSSProperties = {
  ...glassPanel,
  backgroundColor: "rgba(30,41,59,0.6)",
  padding: "24px",
  borderRadius: "8px",
  border: "1px solid rgba(88,101,242,0.2)",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const labelSm: CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: C.onSurfaceVariant,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

export function StatsGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>

      {/* Storage */}
      <div style={glassCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={labelSm}>使用ストレージ</span>
          <Icon name="cloud_done" style={{ color: ACCENT_L }} />
        </div>
        <div>
          <p style={{ fontSize: "30px", fontWeight: 800, color: "white", margin: 0 }}>842.5 GB</p>
          <p style={{ fontSize: "12px", color: C.outline, marginTop: "4px" }}>合計 2TB 中</p>
        </div>
        <div style={{ width: "100%", backgroundColor: "#0f172a", height: "4px", borderRadius: "9999px", overflow: "hidden" }}>
          <div
            style={{
              backgroundColor: ACCENT,
              height: "100%",
              width: "42%",
              boxShadow: "0 0 10px rgba(88,101,242,0.8)",
            }}
          />
        </div>
      </div>

      {/* Active Users */}
      <div style={glassCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={labelSm}>アクティブユーザー</span>
          <Icon name="group" style={{ color: ACCENT_L }} />
        </div>
        <div>
          <p style={{ fontSize: "30px", fontWeight: 800, color: "white", margin: 0 }}>12,490</p>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
            <Icon name="trending_up" size={16} style={{ color: "#4ade80" }} />
            <span style={{ fontSize: "12px", color: "#4ade80" }}>+12% vs 先週</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", height: "32px", gap: "4px" }}>
          {[40, 60, 55, 80, 100].map((h, i) => (
            <div
              key={i}
              style={{
                backgroundColor: i === 4 ? ACCENT : `rgba(88,101,242,${0.2 + i * 0.05})`,
                flex: 1,
                height: `${h}%`,
                borderRadius: "2px",
              }}
            />
          ))}
        </div>
      </div>

      {/* Peak Activity */}
      <div style={glassCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={labelSm}>ピークアクティビティ</span>
          <Icon name="bolt" style={{ color: ACCENT_L }} />
        </div>
        <div>
          <p style={{ fontSize: "30px", fontWeight: 800, color: "white", margin: 0 }}>4.2 GB/s</p>
          <p style={{ fontSize: "12px", color: C.outline, marginTop: "4px" }}>03:45 UTC に記録</p>
        </div>
        <svg width="100%" height="32" overflow="visible">
          <path
            d="M0 35 Q 25 35, 50 20 T 100 25 T 150 10 T 200 5"
            fill="none"
            stroke={ACCENT}
            strokeWidth="2"
          />
          <circle className="animate-pulse" cx="200" cy="5" r="3" fill={ACCENT} />
        </svg>
      </div>
    </div>
  );
}
export default StatsGrid;