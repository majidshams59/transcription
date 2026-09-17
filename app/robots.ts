import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

/**
 * Served at /robots.txt.
 *
 * The whole site is crawlable except /api/, which only issues short-lived
 * session credentials and has nothing indexable in it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
