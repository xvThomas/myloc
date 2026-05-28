import { useState } from "react";
import { PlayIcon, StopIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/solid";
import type { SavedRouteSummary } from "../types/vehicle";

interface VehicleRouteListProps {
  routes: SavedRouteSummary[];
  selectedRouteId: string | null;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onNewRoute: () => void;
}

export default function VehicleRouteList({
  routes,
  selectedRouteId,
  onSelect,
  onStart,
  onStop,
  onDelete,
  onRename,
  onNewRoute,
}: VehicleRouteListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const commitRename = (id: string) => {
    const trimmed = editName.trim();
    if (trimmed) {
      onRename(id, trimmed);
    }
    setEditingId(null);
  };

  return (
    <div className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-700">Itinéraires</h2>
        <button
          onClick={onNewRoute}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          + Nouveau
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {routes.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-slate-400">
            Aucun itinéraire enregistré
          </p>
        )}

        {routes.map((route) => (
          <div
            key={route.id}
            onClick={() => onSelect(route.id)}
            className={`flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-2 transition-colors hover:bg-slate-50 ${
              selectedRouteId === route.id ? "bg-blue-50" : ""
            }`}
          >
            {/* Status indicator */}
            <div
              className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                route.status === "started"
                  ? "bg-green-500"
                  : route.status === "stopped"
                    ? "bg-slate-400"
                    : "bg-blue-400"
              }`}
            />

            {/* Name or rename input */}
            <div className="min-w-0 flex-1">
              {editingId === route.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => commitRename(route.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(route.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-full rounded border border-blue-300 px-1 py-0.5 text-xs focus:outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="block truncate text-xs font-medium text-slate-700">
                  {route.name}
                </span>
              )}
            </div>

            {/* Action icons */}
            <div className="flex flex-shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {route.status !== "started" ? (
                <button
                  onClick={() => onStart(route.id)}
                  title="Démarrer"
                  className="rounded p-1 text-green-600 hover:bg-green-100"
                >
                  <PlayIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => onStop(route.id)}
                  title="Arrêter"
                  className="rounded p-1 text-orange-600 hover:bg-orange-100"
                >
                  <StopIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => startEditing(route.id, route.name)}
                title="Renommer"
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(route.id)}
                title="Supprimer"
                className="rounded p-1 text-red-500 hover:bg-red-100"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
