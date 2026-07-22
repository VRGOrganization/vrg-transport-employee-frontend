import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
// Origem pública do object storage (MinIO em dev, R2 em prod) — precisa
// estar liberada no img-src, senão o browser bloqueia via CSP mesmo com
// presigned URL válida.
const storagePublicOrigin = process.env.STORAGE_PUBLIC_ENDPOINT?.trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              `img-src 'self' data: blob:${storagePublicOrigin ? ` ${storagePublicOrigin}` : ""}`,
              // Download de documento faz fetch() direto na presigned URL do
              // storage (cardUtils.ts:downloadMedia) — isso é connect-src, não
              // img-src/frame-src. Sem essa origem aqui, o fetch é bloqueado
              // pelo CSP mesmo com URL assinada válida.
              `connect-src 'self'${isProd ? "" : " ws: wss:"}${storagePublicOrigin ? ` ${storagePublicOrigin}` : ""}`,
              "font-src 'self' data: https://fonts.gstatic.com",
              "worker-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              `frame-src 'self' data: blob:${storagePublicOrigin ? ` ${storagePublicOrigin}` : ""}`,
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
