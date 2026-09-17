/** @type {import('next').NextConfig} */
const nextConfig = {
  // Drops the x-powered-by header; no SEO effect, one less fingerprint.
  poweredByHeader: false,
  // Canonical URLs, the sitemap and robots.txt are all generated without a
  // trailing slash, so keep the router consistent with them.
  trailingSlash: false,
}

export default nextConfig
