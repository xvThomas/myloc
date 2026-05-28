import type { RoutePortion } from "../services/routeService";
import type { LatLng } from "../types/geo";

interface VehicleRouteStepsProps {
  portions: RoutePortion[];
  onClose: () => void;
  onStepClick?: (position: LatLng, portionIndex: number, stepIndex: number) => void;
  selectedStep?: { portionIndex: number; stepIndex: number } | null;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  if (min < 60) return sec > 0 ? `${min} min ${sec} s` : `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h} h ${m} min`;
}

function formatDistanceDuration(meters: number, seconds: number): string | null {
  const d = Math.round(meters) > 0 ? formatDistance(meters) : null;
  const t = Math.round(seconds) > 0 ? formatDuration(seconds) : null;
  if (d && t) return `${d} · ${t}`;
  return d || t || null;
}

function instructionLabel(instruction: { type: string; modifier?: string }): string {
  const types: Record<string, string> = {
    depart: "Départ",
    arrive: "Arrivée",
    turn: "Tourner",
    "new name": "Continuer",
    merge: "Insérez-vous",
    "on ramp": "Prendre la bretelle",
    "off ramp": "Sortir",
    fork: "Embranchement",
    "end of road": "Fin de route",
    continue: "Continuer",
    roundabout: "Rond-point",
    rotary: "Rond-point",
    "roundabout turn": "Sortie rond-point",
    notification: "Info",
  };

  const modifiers: Record<string, string> = {
    left: "à gauche",
    right: "à droite",
    "sharp left": "fortement à gauche",
    "sharp right": "fortement à droite",
    "slight left": "légèrement à gauche",
    "slight right": "légèrement à droite",
    straight: "tout droit",
    uturn: "demi-tour",
  };

  const typeStr = types[instruction.type] || instruction.type;
  const modStr = instruction.modifier ? modifiers[instruction.modifier] || instruction.modifier : "";
  return modStr ? `${typeStr} ${modStr}` : typeStr;
}

function streetName(attributes?: { name?: { nom_1_gauche?: string; nom_1_droite?: string } }): string | null {
  if (!attributes?.name) return null;
  return attributes.name.nom_1_gauche || attributes.name.nom_1_droite || null;
}

export default function VehicleRouteSteps({ portions, onClose, onStepClick, selectedStep }: VehicleRouteStepsProps) {
  let globalStepIndex = 0;

  return (
    <div className="flex h-full w-80 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-700">Instructions</h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {portions.map((portion, portionIndex) => {
          // Skip last step ("arrive", 0m/0s) of all portions except the last one
          const isLastPortion = portionIndex === portions.length - 1;
          const stepsToRender = isLastPortion
            ? portion.steps
            : portion.steps.filter((s) => s.instruction.type !== "arrive");

          // Skip first step ("depart") of all portions except the first one — merged into waypoint banner
          const skipFirst = portionIndex > 0;
          const firstStep = portion.steps[0];
          const waypointName = skipFirst ? streetName(firstStep?.attributes) : null;

          return (
            <div key={portionIndex}>
              {/* Portion header */}
              {portionIndex === 0 ? (
                <div
                  className={`flex cursor-pointer items-center gap-2 bg-emerald-50 px-4 py-2 border-b border-emerald-200 ${
                    selectedStep?.portionIndex === 0 && selectedStep?.stepIndex === -1 ? "ring-2 ring-inset ring-emerald-400" : ""
                  }`}
                  onClick={() => onStepClick?.(portion.start, portionIndex, -1)}
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    D
                  </div>
                  <span className="text-xs font-semibold text-emerald-700">Départ</span>
                  {formatDistanceDuration(portion.distance, portion.duration) && (
                    <span className="ml-auto text-[10px] text-emerald-600">
                      {formatDistanceDuration(portion.distance, portion.duration)}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  className={`flex cursor-pointer items-center gap-2 bg-amber-50 px-4 py-2 border-b border-amber-200 ${
                    selectedStep?.portionIndex === portionIndex && selectedStep?.stepIndex === -1 ? "ring-2 ring-inset ring-amber-400" : ""
                  }`}
                  onClick={() => onStepClick?.(portion.start, portionIndex, -1)}
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    {portionIndex}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-amber-700">
                      Étape {portionIndex}
                    </span>
                    {waypointName && (
                      <span className="ml-2 text-xs text-amber-600">{waypointName}</span>
                    )}
                  </div>
                  {formatDistanceDuration(portion.distance, portion.duration) && (
                    <span className="flex-shrink-0 text-[10px] text-amber-600">
                      {formatDistanceDuration(portion.distance, portion.duration)}
                    </span>
                  )}
                </div>
              )}

              {/* Steps within this portion */}
              {stepsToRender.map((step, stepIndex) => {
                // Skip the first step of non-first portions (merged into waypoint banner)
                if (skipFirst && stepIndex === 0) return null;
                const num = ++globalStepIndex;
                const name = streetName(step.attributes);
                const coords = step.geometry.coordinates as [number, number][];
                const stepPosition: LatLng = { lng: coords[0]![0], lat: coords[0]![1] };
                const isSelected = selectedStep?.portionIndex === portionIndex && selectedStep?.stepIndex === stepIndex;
                return (
                  <div
                    key={stepIndex}
                    className={`flex cursor-pointer items-start gap-3 border-b border-slate-50 px-4 py-3 hover:bg-slate-50 ${
                      isSelected ? "bg-red-50 ring-2 ring-inset ring-red-300" : ""
                    }`}
                    onClick={() => onStepClick?.(stepPosition, portionIndex, stepIndex)}
                  >
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                      {num}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800">
                        {instructionLabel(step.instruction)}
                      </p>
                      {name && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">{name}</p>
                      )}
                      {formatDistanceDuration(step.distance, step.duration) && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {formatDistanceDuration(step.distance, step.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Arrival marker */}
        <div
          className="flex cursor-pointer items-center gap-2 bg-red-50 px-4 py-2 border-b border-red-200"
          onClick={() => {
            const lastPortion = portions[portions.length - 1];
            if (lastPortion) onStepClick?.(lastPortion.end, portions.length - 1, -2);
          }}
        >
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white text-[10px] font-bold text-white"
            style={{
              backgroundImage: "linear-gradient(45deg, #dc2626 25%, #111827 25%, #111827 50%, #dc2626 50%, #dc2626 75%, #111827 75%, #111827 100%)",
              backgroundSize: "4px 4px",
            }}
          >
            A
          </div>
          <span className="text-xs font-semibold text-red-700">Arrivée</span>
          {formatDistanceDuration(portions.reduce((sum, p) => sum + p.distance, 0), portions.reduce((sum, p) => sum + p.duration, 0)) && (
            <span className="ml-auto text-[10px] text-red-600">
              {formatDistanceDuration(portions.reduce((sum, p) => sum + p.distance, 0), portions.reduce((sum, p) => sum + p.duration, 0))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
