import Card from "../ui/Card";
import { C } from "../../theme/tokens";
import { Icon } from "../Icon";

export default function PreviewPanel() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 896,
          aspectRatio: "16/9",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3WWddb8Ac7UQ3jHGbkZKdU-GAkp6DISBGfUMuOEa_c0RothMqt_I1Y4-b3oLGYzdOCy2v89IRbDUPU2NIiIbJwN8Mr5rWnvZW9_pmd3qTK8TJ3Uq0H3TPXDfjYIJR-uiSOthb-Tzwqj-Y-fVfd4njI7bdSwHC4gUQviWNttBgcJeqSp5x6RY4SB_ecb8VuNoS1jTSQ8zOkUTB4nINxuZR_FiPZkzJRzs4xd0hA8tg29YJpTDKUQX807GDToN3vGz-AJiCfSzdXpKT"
          alt="Preview"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.8,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 16,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.primary,
              }}
            >
              00:02:45 / 00:10:00
            </span>

            <div style={{ display: "flex", gap: 16 }}>
              <Icon name="settings" size={20} />
              <Icon name="fullscreen" size={20} />
            </div>
          </div>

          <div
            style={{
              height: 4,
              width: "100%",
              backgroundColor: C.surfaceVariant,
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                height: "100%",
                width: "25%",
                backgroundColor: C.primary,
                borderRadius: 999,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: -6,
                  top: -4,
                  width: 12,
                  height: 12,
                  backgroundColor: C.primary,
                  borderRadius: "50%",
                  border: "2px solid white",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 48,
            }}
          >
            <Icon name="skip_previous" size={32} />
            <Icon name="play_circle" size={48} filled />
            <Icon name="skip_next" size={32} />
          </div>
        </div>
      </Card>
    </div>
  );
}