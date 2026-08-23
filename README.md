This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## ParkFinder (`/parking`)

A parking finder: car parks and on-street bays on a map, with tariffs where
they're known.

**Data comes from OpenStreetMap** via the [Overpass API](https://overpass-api.de/),
queried for the visible map area. Geocoding and reverse geocoding use
[Nominatim](https://nominatim.openstreetmap.org/). No API keys needed, but both
are shared public services — requests are debounced, superseded ones aborted,
and each response covers a padded area so small pans reuse what's loaded. If
this ever sees real traffic, move to a self-hosted Overpass instance or a
commercial provider; the public endpoints are not for production load.

**Coverage is uneven, by design of the source.** OSM records parking locations
well and prices poorly, so many spots show "Price not recorded" rather than a
tariff. The UI states that plainly instead of guessing. Real-time space
availability isn't in OSM at all, so it isn't shown.

Panning or zooming reloads the area, and the map centre acts as the current
search location, so distances and ordering follow the view.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
