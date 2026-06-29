import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // pdfjs-dist optionally requires canvas in Node.js. Stub it out in both bundlers.
  turbopack: {
    resolveAlias: {
      canvas: "./src/lib/canvas-stub.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ebooksstore.co.mz";

    const securityHeaders = [
      // Prevent clickjacking — only allow framing from same origin
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      // Prevent MIME-type sniffing
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Control referrer information sent on navigation
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Restrict browser features — disable unused powerful APIs
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
      },
      // Enable HSTS (only effective over HTTPS in production)
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      // Content Security Policy
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          // Scripts: self + Next.js inline scripts + Firebase
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com",
          // Styles: self + inline (Tailwind/CSS-in-JS)
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          // Fonts
          "font-src 'self' https://fonts.gstatic.com",
          // Images: self + blob (PDF.js canvases) + external covers/avatars
          `img-src 'self' blob: data: ${apiUrl} https://*.amazonaws.com https://www.gstatic.com`,
          // Fetch/XHR: self + backend API + Firebase
          `connect-src 'self' ${apiUrl} ${siteUrl} https://fcm.googleapis.com https://firebaseinstallations.googleapis.com https://*.googleapis.com`,
          // Workers: self + blob (PDF.js web worker)
          "worker-src 'self' blob:",
          // Frames: self only (PayPal redirect goes to a new tab, not iframe)
          "frame-src 'self'",
          // Media: self
          "media-src 'self' blob:",
          // Object (PDFs in <object>): none — we use PDF.js canvas instead
          "object-src 'none'",
          // Base URI
          "base-uri 'self'",
          // Form targets
          "form-action 'self'",
        ].join("; "),
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "your-minio-domain.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
      // MinIO production
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
