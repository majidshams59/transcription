// Calls Speechmatics at request time, so it must not be prerendered at build:
// doing so fails the build wherever the API is unreachable or the key is unset.
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

  return Response.json(res)
}
