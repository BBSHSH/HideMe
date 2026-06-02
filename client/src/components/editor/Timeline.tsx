import Card from "../ui/Card";
import { C } from "../../theme/tokens";
import { Icon } from "../Icon";

export default function Timeline() {
  return (
    <Card
      style={{
        height: 192,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          height: 40,
          borderBottom: "1px solid rgba(69,70,85,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              backgroundColor: "rgba(190,194,255,0.1)",
              border: "1px solid rgba(190,194,255,0.3)",
              borderRadius: 4,
              color: C.primary,
              cursor: "pointer",
            }}
          >
            <Icon name="content_cut" size={18} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ここでカット
            </span>
          </button>

          <div
            style={{
              width: 1,
              height: 16,
              backgroundColor: "rgba(69,70,85,0.4)",
            }}
          />

          <Icon
            name="undo"
            size={20}
            style={{
              color: C.onSurfaceVariant,
              cursor: "pointer",
            }}
          />

          <Icon
            name="redo"
            size={20}
            style={{
              color: C.onSurfaceVariant,
              cursor: "pointer",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon
            name="zoom_out"
            size={18}
            style={{
              color: C.onSurfaceVariant,
            }}
          />

          <input
            type="range"
            style={{
              width: 128,
              height: 4,
            }}
          />

          <Icon
            name="zoom_in"
            size={18}
            style={{
              color: C.onSurfaceVariant,
            }}
          />
        </div>
      </div>

      {/* Timeline Area */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#0d0e16",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          padding: 4,
        }}
      >
        {/* Ruler */}
        <div
          style={{
            height: 24,
            display: "flex",
            borderBottom: "1px solid rgba(69,70,85,0.1)",
            fontSize: 10,
            color: "#454655",
            alignItems: "flex-end",
            paddingBottom: 4,
            overflow: "hidden",
          }}
        >
          {[
            "00:00:00",
            "00:01:00",
            "00:02:00",
            "00:03:00",
            "00:04:00",
          ].map((time, i) => (
            <div
              key={time}
              style={{
                width: 128,
                flexShrink: 0,
                textAlign: "center",
                borderRight: "1px solid rgba(69,70,85,0.2)",
                color: i === 3 ? C.primary : "#454655",
                fontWeight: i === 3 ? 700 : 400,
              }}
            >
              {time}
            </div>
          ))}
        </div>

        {/* Track */}
        <div
          style={{
            flex: 1,
            position: "relative",
            paddingTop: 16,
          }}
        >
          <div
            style={{
              height: 64,
              width: "100%",
              backgroundColor: "rgba(190,194,255,0.05)",
              border: "1px solid rgba(190,194,255,0.2)",
              borderRadius: 4,
              overflow: "hidden",
              display: "flex",
              position: "relative",
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRight: "1px solid rgba(69,70,85,0.1)",
                }}
              />
            ))}

            {/* Selected Clip */}
            <div
              style={{
                position: "absolute",
                left: 100,
                right: 250,
                top: 0,
                bottom: 0,
                backgroundColor: "rgba(190,194,255,0.3)",
                borderLeft: `2px solid ${C.primary}`,
                borderRight: `2px solid ${C.primary}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 8,
                  backgroundColor: C.primary,
                  cursor: "col-resize",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 2,
                    height: 16,
                    backgroundColor: C.onPrimary,
                    borderRadius: 999,
                  }}
                />
              </div>

              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 8,
                  backgroundColor: C.primary,
                  cursor: "col-resize",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 2,
                    height: 16,
                    backgroundColor: C.onPrimary,
                    borderRadius: 999,
                  }}
                />
              </div>

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.primary,
                  }}
                >
                  SELECTED_RANGE.mp4
                </span>
              </div>
            </div>
          </div>

          {/* Playhead */}
          <div
            style={{
              position: "absolute",
              left: 300,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: C.primary,
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -4,
                left: -5,
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: `8px solid ${C.primary}`,
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}