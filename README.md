# A little weather

A standalone Vite / React / TypeScript weather sculpture with React Three Fiber, Three.js and Drei. All shapes are procedural; there are no downloaded models or image assets.

## Run

From this folder, run `npm install`, then `npm run dev -- --port 5174` and open http://127.0.0.1:5174. The current workspace can also use the packages already installed in its parent folder. `npm run build` checks TypeScript and creates `dist`. `npm run preview` serves the production build. `npm test` checks condition mapping, response validation, request parameters and geometry winding.

The Scene Study controls appear only in the development server. They change the sculpture and background while preserving the real temperature and condition. Live Weather is the default. Production builds omit these controls.

## Weather and location

- On load, browser geolocation is requested. Denied, missing, timed-out or unanswered requests fall back to Ann Arbor, Michigan with a visible notice.
- Open-Meteo supplies Fahrenheit temperature, WMO weather code, day/night and daily high/low. Data refreshes every 15 minutes; Refresh fetches immediately. Daily values are matched to the current date in the API's location timezone.
- BigDataCloud's browser-only reverse geocoder labels a successfully obtained device location. It is never called for the fixed fallback location. If the lookup fails, the label reads “Your location” and explains the unavailable city name.
- Location coordinates go directly from the browser to the weather/geocoding providers; no backend, accounts or location storage are used. Geolocation needs localhost or HTTPS.
- An API failure leaves unavailable values blank; if a previous reading exists, it is retained and marked as the last update.
- Rain, snow and thunderstorms use the rainfall sculpture with their accurate textual conditions. Precipitation takes priority at night. Cloudy/foggy nights retain the cloud rather than showing a clear moon.

## Visuals and interaction

`src/geometry.ts` builds a cloud using a smooth union of ellipsoid distance fields and marching cubes, a volumetric swept crescent, and lathed drops. `src/Scene.tsx` owns lighting, clay materials and animation. `src/weather.ts` keeps weather mapping and parsing independent of rendering.

Drag with mouse or touch to turn the object within a constrained range. It returns gently to its presentation angle on release. Pointer parallax, floating and rain stop for reduced-motion preferences; direct dragging remains available.

References: [Open-Meteo API](https://open-meteo.com/en/docs), [BigDataCloud client geocoding](https://www.bigdatacloud.com/docs/free-api/free-reverse-geocode-to-city-api).
