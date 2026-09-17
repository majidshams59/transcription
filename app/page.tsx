import type { Metadata } from 'next'
import { LiveCaptions } from '@/components/live-captions'
import { FaqJsonLd } from '@/components/json-ld'
import { faqs, features, steps } from '@/lib/content'
import { siteConfig } from '@/lib/site'

// This file is deliberately a server component. Everything below is in the
// HTML that search engines receive on the first request; only <LiveCaptions />
// is shipped as client JavaScript.
export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-4 py-16 sm:px-6 lg:px-8">
      <header className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Live captions and real-time translation in your browser
        </h1>
        <p className="max-w-2xl text-balance text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
          {siteConfig.description}
        </p>
      </header>

      <section aria-labelledby="try-it" className="flex flex-col gap-6">
        <h2 id="try-it" className="sr-only">
          Try it now
        </h2>
        <LiveCaptions />
      </section>

      <section aria-labelledby="features" className="flex flex-col gap-8">
        <h2
          id="features"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        >
          What {siteConfig.name} gives you
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 p-6 dark:border-gray-800"
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-it-works" className="flex flex-col gap-8">
        <h2
          id="how-it-works"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        >
          How it works
        </h2>
        <ol className="flex flex-col gap-6">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-gray-50 dark:bg-gray-50 dark:text-gray-900"
              >
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq" className="flex flex-col gap-8">
        <h2 id="faq" className="text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <div className="flex flex-col gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-lg border border-gray-200 p-6 dark:border-gray-800"
            >
              <summary className="cursor-pointer list-none marker:content-['']">
                {/* A heading inside <summary> is valid HTML and puts every
                    question into the document outline. */}
                <h3 className="text-lg font-semibold">{faq.question}</h3>
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
        <p>
          {siteConfig.name} — {siteConfig.shortDescription}
        </p>
      </footer>

      <FaqJsonLd />
    </main>
  )
}
