import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sqlite3 содержит нативный модуль (.node), его нельзя собирать в бандл сервера:
  // Next.js должен подключать этот пакет напрямую во время выполнения.
  serverExternalPackages: ["sqlite3"],
};

export default nextConfig;
