import type { NextConfig } from 'next';

const SUPABASE_HOST = 'https://tcuclwlarygumyawssqs.supabase.co';
const SUPABASE_WSS  = 'wss://tcuclwlarygumyawssqs.supabase.co';

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js hydration scripts require 'unsafe-inline' (no nonce system);
  // MapLibre WebAssembly requires 'wasm-unsafe-eval'
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  // data: for inline SVGs; blob: for MapLibre WebGL textures
  `img-src 'self' data: blob: ${SUPABASE_HOST}`,
  // next/font self-hosts Inter at build time — no external font request
  "font-src 'self'",
  [
    "connect-src 'self'",
    SUPABASE_HOST,
    SUPABASE_WSS,
    'https://api.open-meteo.com',
    'https://marine-api.open-meteo.com',
    'https://tiles.openfreemap.org',
    'https://va.vercel-scripts.com',
  ].join(' '),
  // MapLibre uses Web Workers via blob: URLs
  "worker-src blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
