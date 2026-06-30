import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exporta o painel como site estático (SPA client-side com Firebase).
  output: "export",
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
