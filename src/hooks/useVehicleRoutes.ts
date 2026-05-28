import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehicleRouteApi } from "../services/vehicleRouteApi";
import type { RouteResult } from "../services/routeService";
import type { VehiclePosition } from "../types/vehicle";

const ROUTES_KEY = ["vehicle-routes"] as const;

export function useVehicleRouteList() {
  return useQuery({
    queryKey: ROUTES_KEY,
    queryFn: vehicleRouteApi.list,
  });
}

export function useVehicleRoute(id: string | null) {
  return useQuery({
    queryKey: [...ROUTES_KEY, id],
    queryFn: () => vehicleRouteApi.getById(id!),
    enabled: !!id,
  });
}

export function useVehiclePosition(routeId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...ROUTES_KEY, routeId, "position"],
    queryFn: () => vehicleRouteApi.getPosition(routeId!),
    enabled: !!routeId && enabled,
    refetchInterval: 1000,
    select: (data) => ("speedKmh" in data ? (data as VehiclePosition) : null),
  });
}

export function useSaveRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, routeResult }: { name: string; routeResult: RouteResult }) =>
      vehicleRouteApi.save(name, routeResult),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROUTES_KEY }),
  });
}

export function useStartRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleRouteApi.start(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROUTES_KEY }),
  });
}

export function useStopRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleRouteApi.stop(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROUTES_KEY }),
  });
}

export function useDeleteRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleRouteApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROUTES_KEY }),
  });
}

export function useRenameRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      vehicleRouteApi.rename(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROUTES_KEY }),
  });
}
