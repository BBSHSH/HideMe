import { C, F } from "../../theme/tokens";
import { Icon } from "../Icon";

type Props = {
  volume: number;
  setVolume: (v: number) => void;

  fps: 24 | 30 | 60;
  setFps: (fps: 24 | 30 | 60) => void;

  resolution: string;
  setResolution: (value: string) => void;
};

export default function PropertiesPanel({
  volume,
  setVolume,
  fps,
  setFps,
  resolution,
  setResolution,
}: Props) {
  return (
    <>
      {/* Volume */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h3
          style={{
            ...F.labelSm,
            color: C.primary,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name="volume_up" size={18} />
          音量調整
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
            }}
          />

          <div
            style={{
              position: "relative",
              width: 64,
            }}
          >
            <input
              type="text"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{
                width: "100%",
                backgroundColor: C.surfaceContainerHigh,
                border: `1px solid rgba(69,70,85,0.2)`,
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 8px",
                textAlign: "center",
                color: C.onSurface,
                outline: "none",
              }}
            />

            <span
              style={{
                position: "absolute",
                right: 8,
                top: 4,
                fontSize: 10,
                color: C.outline,
              }}
            >
              %
            </span>
          </div>
        </div>
      </div>

      {/* Quality Settings */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h3
          style={{
            ...F.labelSm,
            color: C.primary,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name="settings_video_camera" size={18} />
          画質設定
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <label
              style={{
                fontSize: 11,
                color: C.onSurfaceVariant,
              }}
            >
              解像度
            </label>

            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: C.surfaceContainerHigh,
                border: `1px solid rgba(69,70,85,0.2)`,
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                padding: 8,
                color: C.onSurface,
                outline: "none",
              }}
            >
              <option>4K (3840 x 2160)</option>
              <option>1080p (1920 x 1080)</option>
              <option>720p (1280 x 720)</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <label
              style={{
                fontSize: 11,
                color: C.onSurfaceVariant,
              }}
            >
              フレームレート
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 4,
              }}
            >
              {([24, 30, 60] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  style={{
                    padding: "6px 0",
                    backgroundColor:
                      fps === f
                        ? "rgba(190,194,255,0.1)"
                        : "rgba(26,27,35,0.8)",

                    border: `1px solid ${
                      fps === f
                        ? "rgba(190,194,255,0.4)"
                        : "rgba(69,70,85,0.2)"
                    }`,

                    color:
                      fps === f
                        ? C.primary
                        : C.onSurfaceVariant,

                    fontSize: 10,
                    borderRadius: 4,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}