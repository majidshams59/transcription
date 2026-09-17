import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site'

/** Served at /manifest.webmanifest — makes the app installable and gives
 *  mobile search results a proper name and theme colour. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.shortDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a0a0a',
    lang: siteConfig.language,
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
