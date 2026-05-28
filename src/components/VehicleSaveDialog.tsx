import { useState } from "react";

interface VehicleSaveDialogProps {
  onSave: (name: string) => void;
  onSaveAndStart: (name: string) => void;
  onCancel: () => void;
}

export default function VehicleSaveDialog({ onSave, onSaveAndStart, onCancel }: VehicleSaveDialogProps) {
  const [name, setName] = useState("");

  const trimmed = name.trim();

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
        <div className="flex gap-2">
          <button
            onClick={() => trimmed && onSave(trimmed)}
            disabled={!trimmed}
            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Enregistrer
          </button>
          <button
            onClick={() => trimmed && onSaveAndStart(trimmed)}
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
