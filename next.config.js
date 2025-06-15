/** @type {import('next').NextConfig} */
const nextConfig = {
  // PostgreSQL로 마이그레이션하면서 better-sqlite3 제거
  // serverExternalPackages: ['better-sqlite3'],
};

module.exports = nextConfig;
