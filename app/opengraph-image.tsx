import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site'

/**
 * Generated social preview card, served at /opengraph-image.
 * Next.js also reuses it for the Twitter/X card when no twitter-image exists.
 */
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1f2937 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color: '#9ca3af',
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {siteConfig.tagline}
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 34,
            color: '#d1d5db',
            lineHeight: 1.4,
          }}
        >
          {siteConfig.shortDescription}
        </div>
      </div>
    ),
    size
  )
}
