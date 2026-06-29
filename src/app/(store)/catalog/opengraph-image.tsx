import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function CatalogOGImage() {
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
          background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 80,
            display: "flex",
            gap: 16,
          }}
        >
          {["📘", "📗", "📙", "📕"].map((emoji, i) => (
            <div
              key={i}
              style={{
                fontSize: 80,
                opacity: 0.15 + i * 0.08,
                transform: `rotate(${(i - 1.5) * 8}deg)`,
                display: "flex",
              }}
            >
              {emoji}
            </div>
          ))}
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
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
            }}
          >
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
            Catálogo
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: "-1px",
            marginBottom: 20,
            maxWidth: 720,
          }}
        >
          Explore Milhares de Livros
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
          }}
        >
          Filtre por categoria, preço, tipo e muito mais
        </div>
      </div>
    ),
    size
  );
}
