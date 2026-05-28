import { useState } from "react";
import type { RouteType } from "../types/vehicle";

interface VehicleSaveDialogProps {
  isCircular?: boolean;
  onSave: (name: string, routeType: RouteType) => void;
  onSaveAndStart: (name: string, routeType: RouteType) => void;
  onCancel: () => void;
}

export default function VehicleSaveDialog({ isCircular = false, onSave, onSaveAndStart, onCancel }: VehicleSaveDialogProps) {
  const [name, setName] = useState("");
  const [routeType, setRouteType] = useState<RouteType>(isCircular ? "circular_continuous" : "continuous");

  const trimmed = name.trim();

  const linearOptions: { value: RouteType; label: string }[] = [
    { value: "one_way", label: "Aller simple" },
    { value: "round_trip", label: "Aller-retour" },
    { value: "continuous", label: "Aller-retour continu" },
  ];

  const circularOptions: { value: RouteType; label: string }[] = [
    { value: "circular_once", label: "Boucle simple" },
    { value: "circular_continuous", label: "Boucle continue" },
  ];

  const options = isCircular ? circularOptions : linearOptions;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/30">
      <div className="w-80 rounded-xl bg-white p-5 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Enregistrer l'itinéraire</h2>
        <input
          type="text"
          placeholder="Nom de l'itinéraire"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          autoFocus
        />

        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-medium text-slate-700">Type d'itinéraire</legend>
          {options.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <input
                type="radio"
                name="routeType"
                value={opt.value}
                checked={routeType === opt.value}
                onChange={() => setRouteType(opt.value)}
                className="accent-blue-600"
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="flex gap-2">
          <button
            onClick={() => trimmed && onSave(trimmed, routeType)}
            disabled={!trimmed}
            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Enregistrer
          </button>
          <button
            onClick={() => trimmed && onSaveAndStart(trimmed, routeType)}
            disabled={!trimmed}
            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Démarrer
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
