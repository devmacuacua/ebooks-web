import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 120,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            display: "flex",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            📚
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "-0.5px",
            }}
          >
            EBooksStore
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            marginBottom: 20,
            maxWidth: 800,
          }}
        >
          Livros Físicos e Digitais em Moçambique
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
            lineHeight: 1.4,
          }}
        >
          Compre ebooks, livros físicos e leia sem limites com subscrição
        </div>

        {/* URL pill */}
        <div
          style={{
            display: "flex",
            marginTop: 48,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 40,
            padding: "10px 24px",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, fontWeight: 500 }}>
            ebooksstore.co.mz
          </span>
        </div>
      </div>
    ),
    size
  );
}
