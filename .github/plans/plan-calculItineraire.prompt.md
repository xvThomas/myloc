# Plan: Calcul d'itinéraire IGN avec dialogue et affichage route

## TL;DR
Modifier le cycle de clic Routing pour ajouter après le 2e clic un dialogue "Calcul d'itinéraire" (Calculer/Annuler). "Annuler" reset tout, "Calculer" appelle l'API IGN navigation OSRM en mode voiture, récupère la géométrie GeoJSON et affiche le tracé sur la carte.

## API IGN confirmée
- URL: `https://data.geopf.fr/navigation/itineraire`
- Méthode: GET
- Paramètres: `resource=bdtopo-osrm&start=lng,lat&end=lng,lat&profile=car&optimization=fastest&getSteps=true&geometryFormat=geojson&distanceUnit=meter&timeUnit=second`
- Réponse: `{ geometry: LineString, distance: number, duration: number, portions: [{ steps: [{ geometry: LineString, distance, duration, instruction, attributes }] }] }`
- Pas de clé API requise

## Steps

### Phase 1: Service API (1 fichier)
1. Créer `src/services/routeService.ts`
   - Type `RouteStep`: `{ geometry: GeoJSON.LineString, distance: number, duration: number, instruction: {type, modifier?}, attributes? }`
   - Type `RouteResult`: `{ geometry: GeoJSON.LineString, distance: number, duration: number, steps: RouteStep[] }`
   - Fonction `computeRoute(start: LatLng, end: LatLng): Promise<RouteResult>`
   - Appel fetch GET avec URLSearchParams, flatMap des portions.steps

### Phase 2: Composants UI (2 fichiers)
2. Créer `src/components/RouteDialog.tsx`
   - Props: `onCalculate`, `onCancel`, `loading: boolean`
   - Affiche titre "Calcul d'itinéraire" + 2 boutons (Annuler, Calculer)
   - Position absolute centrée sur la carte
   - Bouton Calculer affiche "Calcul..." quand loading=true

3. Créer `src/components/RouteLayer.tsx`
   - Props: `route: RouteResult | null`
   - Utilise `<Source type="geojson">` + `<Layer type="line">` de react-map-gl
   - Trace bleu (line-width: 5, line-color: #2563eb, line-cap: round)
   - Ne render rien si route est null

### Phase 3: Refactoring Routing (modifier 1 fichier)
4. Modifier `src/components/Routing.tsx`
   - Ajouter état `phase`: `'idle' | 'start' | 'end' | 'dialog' | 'computing' | 'done'`
   - Ajouter état `route: RouteResult | null`
   - Ajouter état `error: string | null`
   - Cycle: idle→(clic)→start→(clic)→end→dialog automatique
   - Dialog Annuler: reset tout (points + route) → idle
   - Dialog Calculer: phase='computing', appel computeRoute, si succès phase='done' + stocker route + garder flags Départ/Arrivée visibles
   - PAS de 3e clic: après affichage route, les drapeaux et le tracé restent visibles. Pour recommencer, l'utilisateur doit cliquer à nouveau un point de départ (idle).
   - Quand phase='done' et l'utilisateur clique, ça reset et place le nouveau départ (retour à start)
   - Exposer `route` au parent via nouvelle prop `onRouteChange: (route: RouteResult | null) => void`

### Phase 4: Intégration HomePage (modifier 1 fichier)
5. Modifier `src/pages/HomePage.tsx`
   - Ajouter state `route: RouteResult | null`
   - Importer + rendre `<RouteLayer route={route} />` dans `<Map>`
   - Passer `onRouteChange` à `<Routing>`
   - Le dialogue est rendu par Routing lui-même (il est dans le DOM au-dessus de la carte via position absolute)

## Fichiers à créer/modifier
- `src/services/routeService.ts` — créer: appel API IGN
- `src/components/RouteDialog.tsx` — créer: dialogue Calculer/Annuler
- `src/components/RouteLayer.tsx` — créer: affichage tracé GeoJSON sur carte
- `src/components/Routing.tsx` — modifier: nouveau cycle d'états + intégration dialogue + appel service
- `src/pages/HomePage.tsx` — modifier: state route + RouteLayer dans Map

## Verification
1. `npx tsc -b --noEmit` — pas d'erreur TypeScript
2. `npm run build` — build production OK
3. Test manuel: 2 clics → dialogue → Calculer → tracé bleu sur la carte
4. Test Annuler: 2 clics → dialogue → Annuler → tout reset
5. Test erreur réseau: couper réseau, Calculer → message d'erreur affiché

## Decisions
- Moteur OSRM (meilleure performance) plutôt que pgRouting ou Valhalla
- Tracé global (geometry de la réponse) plutôt que step-by-step pour l'affichage principal
- Les steps sont récupérés (getSteps=true) pour usage futur (feuille de route)
- PAS de 3e clic pour reset. 2 scénarios uniquement:
  1. clic Départ → clic Arrivée → dialogue → Calculer → affichage tracé + flags persistants. Nouveau clic = nouveau départ (reset auto)
  2. clic Départ → clic Arrivée → dialogue → Annuler → disparition Départ + Arrivée, retour idle
- Le dialogue est positionné en absolute dans le conteneur carte (pas une modale globale)
