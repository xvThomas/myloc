# Plan: PWA React MapLibre avec position GPS et fond IGN

## TL;DR
Créer une PWA React + Vite + Tailwind + MapLibre affichant la position GPS de l'utilisateur en continu sur un fond de carte IGN "Plan IGN v2" (WMTS gratuit, sans clé API). L'app sera installable avec un service worker cachant le shell applicatif.

## Stack technique
- React 19 + Vite (template react-ts)
- TypeScript
- React Router v7
- Tailwind CSS v4 (plugin `@tailwindcss/vite`)
- MapLibre GL JS v5 + react-map-gl v8
- vite-plugin-pwa (Workbox, autoUpdate)
- Fond de carte : IGN Geoplateforme — tuiles vectorielles TMS/MVT (`https://data.geopf.fr/tms/1.0.0/PLAN.IGN/{z}/{x}/{y}.pbf`) avec style pré-défini (`https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json`)

## Steps

### Phase 1 — Scaffolding projet

1. Initialiser le projet avec `npm create vite@latest mylocation -- --template react-ts`
2. Installer les dépendances :
   - `maplibre-gl`, `react-map-gl`
   - `react-router` (v7)
   - `@tailwindcss/vite`
   - `vite-plugin-pwa` (dev)
3. Configurer `vite.config.ts` avec les plugins : `@vitejs/plugin-react`, `@tailwindcss/vite`, `VitePWA`
4. Ajouter `@import "tailwindcss"` dans le CSS principal
5. Supprimer le boilerplate Vite par défaut (App.tsx, App.css, etc.)

### Phase 2 — Carte MapLibre avec fond IGN (tuiles vectorielles)

6. Utiliser directement le style vectoriel IGN fourni par la Géoplateforme :
   - URL du style : `https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json`
   - Ce style inclut déjà : source vector (`PLAN.IGN/{z}/{x}/{y}.pbf`), glyphs, sprite, et toutes les layers
   - Passer cette URL en prop `mapStyle` de `<Map>`
7. Créer le composant `App.tsx` avec React Router (`BrowserRouter` + `Routes` + une seule `Route path="/"` pointant vers `HomePage`)
8. Créer `src/pages/HomePage.tsx` avec `<Map>` (react-map-gl/maplibre) en plein écran, centré sur la France (lon: 2.35, lat: 46.85, zoom: 6)

### Phase 3 — Géolocalisation continue

9. Créer un hook custom `useGeolocation()` dans `src/hooks/useGeolocation.ts` utilisant `navigator.geolocation.watchPosition` :
   - Retourne `{ latitude, longitude, accuracy, error, loading }`
   - Gère les cas d'erreur (permission refusée, indisponible)
   - Nettoyage via `clearWatch` au démontage
10. Dans `HomePage.tsx`, utiliser le hook pour :
   - Recentrer la carte sur la position au premier fix (`flyTo`)
   - Afficher un `<Marker>` (point bleu) à la position courante
   - Afficher un cercle de précision (optionnel, via une layer circle)
11. Ajouter un bouton "Recentrer" (flottant en bas à droite, stylé Tailwind) qui recentre la carte sur la position

### Phase 4 — PWA

12. Configurer `VitePWA` dans `vite.config.ts` :
    - `registerType: 'autoUpdate'`
    - Manifest : name, short_name, icons, theme_color, background_color, display: 'standalone'
    - Workbox: précache du shell (HTML, JS, CSS), runtime caching pour les assets
13. Ajouter les icônes PWA (192x192, 512x512) dans `public/`
14. Ajouter les meta tags PWA dans `index.html` (theme-color, apple-touch-icon)

### Phase 5 — Polish

15. Ajouter un indicateur d'état (chargement GPS, erreur permission) affiché en overlay Tailwind
16. Responsive : la carte occupe 100vw × 100vh (mobile-first)

## Fichiers à créer/modifier

- `package.json` — dépendances
- `vite.config.ts` — plugins Vite (React, Tailwind, PWA)
- `index.html` — meta tags PWA, viewport
- `src/index.css` — import Tailwind
- `src/main.tsx` — point d'entrée React
- `src/App.tsx` — Router (BrowserRouter + Routes)
- `src/pages/HomePage.tsx` — composant principal avec Map + Marker + bouton recentrer
- `src/hooks/useGeolocation.ts` — hook watchPosition
- (pas de fichier mapStyle.ts nécessaire — le style est chargé directement depuis l'URL IGN)
- `public/icon-192.png`, `public/icon-512.png` — icônes PWA (placeholder SVG converti)

## Détails techniques clés

### Tuiles vectorielles IGN (TMS/MVT)
L'IGN fournit un style MapLibre GL complet prêt à l'emploi. Il suffit de passer l'URL du style JSON directement :

- **Style JSON** : `https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json`
- **Tuiles PBF** : `https://data.geopf.fr/tms/1.0.0/PLAN.IGN/{z}/{x}/{y}.pbf`
- **Glyphs** : `https://data.geopf.fr/annexes/ressources/vectorTiles/fonts/{fontstack}/{range}.pbf`
- **Sprite** : `https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/sprite/PlanIgn`

### Utilisation dans react-map-gl
```tsx
<Map
  mapStyle="https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json"
  // ... other props
/>
```

Aucun style custom nécessaire — le style IGN contient les sources, layers, sprites et fonts.

### Hook useGeolocation
- `watchPosition` avec `enableHighAccuracy: true, maximumAge: 10000, timeout: 15000`
- State : `{ coords: {lat, lng}, accuracy, error, loading }`

## Vérification

1. `npm run dev` → la carte s'affiche avec le fond Plan IGN
2. Autoriser la géoloc → le marqueur apparaît et la carte se recentre
3. `npm run build && npx serve dist` → vérifier que le service worker s'installe (DevTools > Application > Service Workers)
4. Sur mobile (ou DevTools mobile) → vérifier l'installabilité PWA (invite "Ajouter à l'écran d'accueil")
5. Couper le réseau → l'app shell se charge depuis le cache (les tuiles carte ne seront pas disponibles offline, c'est attendu)

## Décisions
- Pas de clé API nécessaire : les tuiles IGN WMTS sur `data.geopf.fr` sont en accès libre
- Pas de cache offline des tuiles (scope "Basic PWA" uniquement)
- TypeScript (.tsx/.ts)
- React Router v7 installé dès le départ (une seule route `/` pour l'instant, mais structure prête à évoluer)
