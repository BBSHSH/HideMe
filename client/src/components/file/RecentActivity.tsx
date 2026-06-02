import { Fragment } from "react";
import RecentFileRow from "./RecentFileRow";
import { glassPanel } from "./styles";
import { recentFiles } from "../../data/files";

export default function RecentActivity() {
  return (
    <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e3e1ed", letterSpacing: "-0.02em" }}>
        Recent Activity
      </h2>
      <div
        style={{
          ...glassPanel,
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid #4546551a`,
        }}
      >
        <div
          style={{
            padding: 20,
            borderBottom: `1px solid #4546551a`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <span className="material-symbols-outlined" style={{ color: "#bec2ff" }}>
            history
          </span>
          <span style={{ fontWeight: 700, fontSize: 20 }}>Latest files uploaded to vault</span>
        </div>
        <div>
          {recentFiles.map((file, index) => (
            <Fragment key={file.id}>
              <RecentFileRow icon={file.icon} iconColor={file.iconColor} name={file.name} meta={file.meta} />
              {index < recentFiles.length - 1 ? <div style={{ height: 1, background: `#4546550d` }} /> : null}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
