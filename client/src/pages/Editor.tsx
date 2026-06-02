import { useState } from "react";

import PreviewPanel from "../components/editor/PreviewPanel";
import Timeline from "../components/editor/Timeline";
import PropertiesPanel from "../components/editor/PropertiesPanel";
import UploadPanel from "../components/editor/UploadPanel";
import ExportPanel from "../components/editor/ExportPanel";

import { C } from "../theme/tokens";

export default function Editor() {
  const [volume, setVolume] = useState(80);
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [resolution, setResolution] = useState(
    "1080p (1920 x 1080)"
  );

  return (
    <main
      style={{
        display: "flex",
        height: "calc(100vh - 64px)",
        background: C.background,
      }}
    >
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <PreviewPanel />
        <Timeline />
      </section>
      <aside
        style={{
          width: 288,
          backgroundColor: "rgba(26, 27, 35, 0.4)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(69,70,85,0.2)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <PropertiesPanel
            volume={volume}
            setVolume={setVolume}
            fps={fps}
            setFps={setFps}
            resolution={resolution}
            setResolution={setResolution}
          />

          <UploadPanel />
        </div>

        <ExportPanel />
      </aside>

    </main>
  );
}