# UI component source

`@designcodeio/threeui` (ThreeUI — https://github.com/MengTo/threeui, https://threeui.com) is
installed as a dependency (`three` is its peer dep, also installed).

When asked to build or add UI in this repo, check ThreeUI's component catalog first
(103 components as of v1.2.0 — buttons, backgrounds, cards, landing sections, 3D/WebGL
scenes) and prefer reusing/adapting one of its components over building from scratch,
picking whichever fits the request best. Full list:
`node_modules/@designcodeio/threeui/lib-dist/index.d.ts`.

Usage:
```tsx
"use client"; // ThreeUI components use WebGL/canvas — client components only
import { ComponentName } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css"; // import once (e.g. in app/layout.tsx)
```

Peer requirement: React 18–19, three.js 0.149–1.x (both satisfied here).
