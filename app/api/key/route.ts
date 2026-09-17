/**
 * Mints a short-lived Speechmatics realtime token for the browser.
 *
 * `force-dynamic` is required: without it Next.js treats this parameterless GET
 * handler as statically prerenderable, calls Speechmatics once at build time and
 * bakes that single token into the build output — so every visitor would share
 * one credential that expires an hour after the deploy.
 *
 * /api/ is disallowed in robots.txt (see app/robots.ts); there is nothing here
 * for a crawler to index.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  // TODO validate paid user
  const res = await fetch('https://mp.speechmatics.com/v1/api_keys?type=rt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SPEECHMATICS_SECRET_KEY}`,
    },
    body: JSON.stringify({ ttl: 3600 }),
  }).then((res) => res.json())

  return Response.json(res, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
