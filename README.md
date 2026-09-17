# Piqiz — Live Captions & Real-Time Translation

A Next.js app that streams microphone audio to the Speechmatics real-time API
and shows an English transcript next to a Mandarin Chinese translation, live in
the browser.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in SPEECHMATICS_SECRET_KEY
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SPEECHMATICS_SECRET_KEY` | yes | Used server-side by `app/api/key/route.ts` to mint a short-lived realtime token. Never exposed to the browser. |
| `NEXT_PUBLIC_SITE_URL` | production | Absolute origin of the deployed site, no trailing slash. Canonical URLs, Open Graph tags, `robots.txt` and `sitemap.xml` are all resolved against it. Falls back to `https://piqiz.com`. |

## SEO

Everything site-specific lives in two files — change those and the rest follows:

- **`lib/site.ts`** — brand name, domain, description, keywords, languages.
- **`lib/content.ts`** — the page copy (features, steps, FAQ). The visible HTML
  and the JSON-LD structured data are both generated from it, so they cannot
  drift apart.

Generated automatically from those:

| Route | File | What it does |
| --- | --- | --- |
| `/robots.txt` | `app/robots.ts` | Allows crawling, blocks `/api/`, points to the sitemap. |
| `/sitemap.xml` | `app/sitemap.ts` | Lists indexable routes. **Add an entry here whenever you add a page.** |
| `/manifest.webmanifest` | `app/manifest.ts` | Installable web app metadata. |
| `/opengraph-image` | `app/opengraph-image.tsx` | 1200×630 social preview card. |

`app/layout.tsx` holds the shared metadata (title template, canonical,
Open Graph, Twitter card, robots directives, theme colour) and renders the
`WebApplication` and `Organization` JSON-LD. `app/page.tsx` is a **server
component** on purpose: the headings, copy and FAQ ship in the initial HTML, and
only `components/live-captions.tsx` is sent to the browser as client JavaScript.

### After deploying

Search engines will not find a new site on their own quickly. Once live:

1. Verify the domain in [Google Search Console](https://search.google.com/search-console)
   and in [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Submit `https://<your-domain>/sitemap.xml` in both.
3. Use Search Console's URL Inspection tool to request indexing of the home page.
4. Check the structured data with the
   [Rich Results Test](https://search.google.com/test/rich-results).

## Project structure

```
app/
  layout.tsx            root metadata, fonts, global JSON-LD
  page.tsx              server-rendered home page
  robots.ts             /robots.txt
  sitemap.ts            /sitemap.xml
  manifest.ts           /manifest.webmanifest
  opengraph-image.tsx   /opengraph-image
  api/key/route.ts      mints a short-lived Speechmatics realtime token
components/
  live-captions.tsx     client component: mic capture + realtime session
  transcript-panel.tsx  transcript / translation display
  json-ld.tsx           structured data
lib/
  site.ts               site-wide SEO config
  content.ts            page copy shared by HTML and structured data
```
