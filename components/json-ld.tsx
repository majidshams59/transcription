import { faqs } from '@/lib/content'
import { siteConfig, siteUrl } from '@/lib/site'

/**
 * Structured data helpers.
 *
 * JSON-LD is injected with a script tag rather than through the Metadata API,
 * which is the approach Next.js documents for the App Router. The payload is
 * built from our own constants — never from user input — so the string is safe
 * to pass to dangerouslySetInnerHTML.
 */
function JsonLd({ id, data }: { id: string; data: Record<string, unknown> }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      // `<` is escaped so a stray sequence can never close the script tag early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}

export function WebApplicationJsonLd() {
  return (
    <JsonLd
      id="ld-webapplication"
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        '@id': `${siteUrl}/#webapp`,
        name: siteConfig.name,
        alternateName: `${siteConfig.name} ${siteConfig.tagline}`,
        url: siteUrl,
        description: siteConfig.description,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (web browser)',
        browserRequirements:
          'Requires a browser with microphone access and MediaRecorder support for WebM/Opus audio.',
        inLanguage: siteConfig.language,
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          `Real-time ${siteConfig.sourceLanguage} speech-to-text`,
          `Live ${siteConfig.targetLanguage} translation`,
          'Browser-based, no installation required',
        ],
      }}
    />
  )
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      id="ld-organization"
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: siteConfig.name,
        url: siteUrl,
        logo: `${siteUrl}/opengraph-image`,
      }}
    />
  )
}

export function FaqJsonLd() {
  return (
    <JsonLd
      id="ld-faq"
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${siteUrl}/#faq`,
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }}
    />
  )
}
