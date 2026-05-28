# Plan: Driver Mode with MSW Backend + IndexedDB Persistence

## Overview
Add a `/driver` route with a dedicated page where the driver can create, name, save, start, and stop itineraries. Server interactions are mocked via MSW (Mock Service Worker). Vehicle position is computed server-side (in MSW handler) over time. Data is persisted in IndexedDB (survives page reloads). Existing code is untouched — new components are prefixed with `Vehicle` when derived from existing ones.

## Architecture

```
/driver → DriverPage
  ├── Left panel: VehicleRouteList (list of saved itineraries + action icons)
  └── Map area:
       ├── Map (same IGN style)
       ├── VehicleRoutingDriver (route creation state machine)
       ├── RouteLayer (display selected itinerary)
       └── VehiclePositionMarker (live position if started)

MSW handlers (persisted in IndexedDB):
  POST   /api/routes              → create/save a named route
  GET    /api/routes              → list all routes
  GET    /api/routes/:id          → get full route details
  POST   /api/routes/:id/start   → start simulation
  POST   /api/routes/:id/stop    → stop simulation
  GET    /api/routes/:id/position → current vehicle position (or null)
```

## Dependencies Added
- `msw` (dev) — Mock Service Worker
- `idb` — Typed IndexedDB wrapper
- `@heroicons/react` — Action icons

## New Files
- `src/types/vehicle.ts`
- `src/mocks/db.ts`
- `src/mocks/handlers.ts`
- `src/mocks/browser.ts`
- `src/services/vehicleRouteApi.ts`
- `src/hooks/useDriverRoutes.ts`
- `src/hooks/useVehiclePosition.ts`
- `src/components/VehicleSaveDialog.tsx`
- `src/components/VehicleRoutingDriver.tsx`
- `src/components/VehiclePositionMarker.tsx`
- `src/components/VehicleRouteList.tsx`
- `src/pages/DriverPage.tsx`

## Modified Files
- `src/App.tsx` — Add `/driver` route
- `src/main.tsx` — Conditional MSW initialization
- `.env` — Add `VITE_ENABLE_MOCKS=true`
