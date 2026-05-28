import { useState, useCallback, useEffect } from "react";
import type { SavedRouteSummary } from "../types/vehicle";
import type { RouteResult } from "../services/routeService";
import {
  listRoutes,
  saveRoute as apiSaveRoute,
  startRoute as apiStartRoute,
  stopRoute as apiStopRoute,
  deleteRouteApi,
  renameRoute as apiRenameRoute,
} from "../services/vehicleRouteApi";

export function useDriverRoutes() {
  const [routes, setRoutes] = useState<SavedRouteSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRoutes();
      setRoutes(data);
    } catch (err) {
      console.error("[useDriverRoutes] Failed to refresh routes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveRoute = useCallback(async (name: string, routeResult: RouteResult) => {
    const saved = await apiSaveRoute(name, routeResult);
    await refresh();
    return saved;
  }, [refresh]);

  const startRoute = useCallback(async (id: string) => {
    await apiStartRoute(id);
    await refresh();
  }, [refresh]);

  const stopRoute = useCallback(async (id: string) => {
    await apiStopRoute(id);
    await refresh();
  }, [refresh]);

  const removeRoute = useCallback(async (id: string) => {
    await deleteRouteApi(id);
    await refresh();
  }, [refresh]);

  const renameRoute = useCallback(async (id: string, name: string) => {
    await apiRenameRoute(id, name);
    await refresh();
  }, [refresh]);

  return { routes, loading, refresh, saveRoute, startRoute, stopRoute, removeRoute, renameRoute };
}
