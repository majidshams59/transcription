import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

/**
 * Served at /sitemap.xml and referenced from robots.txt.
 *
 * Add an entry here for every new indexable route — a page missing from the
 * sitemap is discovered only through internal links, which is slower.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
