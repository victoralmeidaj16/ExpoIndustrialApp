import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build padrão na Vercel (sem "export"): as rotas de API (ex.: webhook
  // Sympla) precisam rodar server-side; páginas continuam SPA client-side.
  images: {
    unoptimized: true,
  },
  // Fixa a raiz do projeto: há outros lockfiles na máquina e o Turbopack
  // inferia a pasta errada.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
