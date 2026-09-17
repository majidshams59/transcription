/**
 * Single source of truth for everything SEO-related that is site-specific.
 *
 * If the brand name, domain or positioning changes, edit THIS file only —
 * metadata, robots.txt, sitemap.xml, the web manifest, the Open Graph image
 * and the JSON-LD structured data all read from here.
 */

/**
 * Absolute origin of the production site, with no trailing slash.
 *
 * Set NEXT_PUBLIC_SITE_URL in the hosting environment. It must be absolute:
 * canonical URLs, Open Graph URLs and the sitemap are all resolved against it,
 * and search engines drop relative values.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://piqiz.com'
).replace(/\/+$/, '')

export const siteConfig = {
  /** Brand name. Used as the suffix of every page title and as the OG site name. */
  name: 'Piqiz',
  /** What the product is, in the words people search for. */
  tagline: 'Live Captions & Real-Time Translation',
  /**
   * Meta description. Kept under ~160 characters so Google does not truncate
   * it in the results snippet.
   */
  description:
    'Free live captions in your browser. Turn spoken English into real-time text and see an instant Mandarin Chinese translation side by side — no install, no upload, just your microphone.',
  /** Shorter variant for the web app manifest and social cards. */
  shortDescription:
    'Real-time English speech-to-text with live Mandarin translation, right in your browser.',
  url: siteUrl,
  locale: 'en_US',
  language: 'en',
  /**
   * Topical keywords. Modern Google ignores the keywords meta tag, but Bing and
   * several social/AI crawlers still read it, and keeping the list here keeps
   * the page copy and the metadata aligned.
   */
  keywords: [
    'live captions',
    'real-time transcription',
    'speech to text',
    'live subtitles',
    'browser speech recognition',
    'English to Chinese translation',
    'real-time translation',
    'meeting captions',
    'accessibility captions',
    'live transcription online',
  ],
  /** Languages the app actually transcribes / translates today. */
  sourceLanguage: 'English',
  targetLanguage: 'Mandarin Chinese',
} as const

export type SiteConfig = typeof siteConfig
