const nextConfig = (phase) => ({
  distDir: process.env.NEXT_BUILD_DIR || (phase === 'phase-development-server' ? '.next-dev' : '.next'),
});
export default nextConfig;
