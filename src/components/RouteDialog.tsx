interface RouteDialogProps {
  onCalculate: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function RouteDialog({ onCalculate, onCancel, loading }: RouteDialogProps) {
  return (
    <div className="absolute inset-x-4 top-1/3 z-50 mx-auto max-w-sm rounded-xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
      <h2 className="text-center text-lg font-semibold text-slate-800">
        Calcul d'itinéraire
      </h2>
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 active:bg-slate-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={onCalculate}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white active:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Calcul..." : "Calculer"}
        </button>
      </div>
    </div>
  );
}
