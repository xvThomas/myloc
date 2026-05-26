# MyLocation

Application web PWA affichant votre position en temps réel sur une carte IGN (tuiles vecteur Plan IGN).

## Stack technique

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- MapLibre GL JS + react-map-gl
- React Router v7
- vite-plugin-pwa (Service Worker Workbox)

## Prérequis

- Node.js ≥ 18
- npm ≥ 9

## Installation

```bash
npm install
```

## Lancer en développement

```bash
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

> **Note :** la géolocalisation nécessite un contexte sécurisé (HTTPS ou `localhost`).

## Build de production

```bash
npm run build
```

Les fichiers sont générés dans le dossier `dist/`.

## Prévisualiser le build

```bash
npm run preview
```

## PWA

L'application fonctionne hors-ligne grâce au Service Worker généré automatiquement par `vite-plugin-pwa`. Les tuiles de carte déjà consultées sont mises en cache par le navigateur.

Pour une installation complète en tant que PWA, remplacez les icônes placeholder (`public/icon-192.png` et `public/icon-512.png`) par de vraies images aux dimensions correspondantes.

## Données cartographiques

Les tuiles vecteur proviennent de la Géoplateforme IGN (accès libre, sans clé API) :

- Style : `https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json`
