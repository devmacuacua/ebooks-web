import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function SubscriptionOGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1e3a5f 0%, #7c3aed 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 140,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            display: "flex",
          }}
        />

        {/* Crown icon area */}
        <div
          style={{
            position: "absolute",
            right: 80,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 160,
            opacity: 0.18,
            display: "flex",
          }}
        >
          👑
        </div>

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            📚
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
            EBooksStore
          </span>
        </div>

        {/* Label */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: "6px 16px",
            marginBottom: 20,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, fontWeight: 600 }}>
            Subscrição
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: "-1px",
            marginBottom: 20,
            maxWidth: 700,
          }}
        >
          Leia Sem Limites
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
            marginBottom: 40,
          }}
        >
          Acesso ilimitado a centenas de ebooks. Cancele quando quiser.
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {["✓ Ebooks ilimitados", "✓ Offline", "✓ Sem compromisso"].map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.12)",
                borderRadius: 40,
                padding: "8px 20px",
                color: "rgba(255,255,255,0.85)",
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
