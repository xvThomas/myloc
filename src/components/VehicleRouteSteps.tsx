import type { RouteResult } from "../services/routeService";
import type { LatLng } from "../types/geo";
import { buildStepItemsFromPortions, type StepItem } from "../services/routeStepsBuilder";

interface VehicleRouteStepsProps {
  route: RouteResult;
  onClose: () => void;
  onStepClick?: (position: LatLng, portionIndex: number, stepIndex: number) => void;
  selectedStep?: { portionIndex: number; stepIndex: number } | null;
}

function renderItem(item: StepItem, selectedStep: VehicleRouteStepsProps["selectedStep"], onStepClick: VehicleRouteStepsProps["onStepClick"]) {
  const isSelected = selectedStep?.portionIndex === item.portionIndex && selectedStep?.stepIndex === item.stepIndex;

  if (item.type === "depart") {
    return (
      <div
        key={`depart-${item.portionIndex}`}
        className={`flex cursor-pointer items-center gap-2 bg-emerald-50 px-4 py-2 border-b border-emerald-200 ${
          isSelected ? "ring-2 ring-inset ring-emerald-400" : ""
        }`}
        onClick={() => onStepClick?.(item.position, item.portionIndex, item.stepIndex)}
      >
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
          D
        </div>
        <span className="text-xs font-semibold text-emerald-700">{item.label}</span>
        {item.distanceDuration && (
          <span className="ml-auto text-[10px] text-emerald-600">{item.distanceDuration}</span>
        )}
      </div>
    );
  }

  if (item.type === "waypoint") {
    return (
      <div
        key={`waypoint-${item.portionIndex}`}
        className={`flex cursor-pointer items-center gap-2 bg-amber-50 px-4 py-2 border-b border-amber-200 ${
          isSelected ? "ring-2 ring-inset ring-amber-400" : ""
        }`}
        onClick={() => onStepClick?.(item.position, item.portionIndex, item.stepIndex)}
      >
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
          {item.portionIndex}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-amber-700">{item.label}</span>
          {item.streetName && (
            <span className="ml-2 text-xs text-amber-600">{item.streetName}</span>
          )}
        </div>
        {item.distanceDuration && (
          <span className="flex-shrink-0 text-[10px] text-amber-600">{item.distanceDuration}</span>
        )}
      </div>
    );
  }

  if (item.type === "arrival") {
    return (
      <div
        key="arrival"
        className="flex cursor-pointer items-center gap-2 bg-red-50 px-4 py-2 border-b border-red-200"
        onClick={() => onStepClick?.(item.position, item.portionIndex, item.stepIndex)}
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
        <span className="text-xs font-semibold text-red-700">{item.label}</span>
        {item.distanceDuration && (
          <span className="ml-auto text-[10px] text-red-600">{item.distanceDuration}</span>
        )}
      </div>
    );
  }

  // type === "step"
  return (
    <div
      key={`step-${item.portionIndex}-${item.stepIndex}`}
      className={`flex cursor-pointer items-start gap-3 border-b border-slate-50 px-4 py-3 hover:bg-slate-50 ${
        isSelected ? "bg-red-50 ring-2 ring-inset ring-red-300" : ""
      }`}
      onClick={() => onStepClick?.(item.position, item.portionIndex, item.stepIndex)}
    >
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
        {item.globalStepNumber}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-800">{item.label}</p>
        {item.streetName && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{item.streetName}</p>
        )}
        {item.distanceDuration && (
          <p className="mt-1 text-[10px] text-slate-400">{item.distanceDuration}</p>
        )}
      </div>
    </div>
  );
}

export default function VehicleRouteSteps({ route, onClose, onStepClick, selectedStep }: VehicleRouteStepsProps) {
  const items = buildStepItemsFromPortions(route.portions);
  //const items = buildStepItemsFromFlatSteps(route);

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
        {items.map((item) => renderItem(item, selectedStep, onStepClick))}
      </div>
    </div>
  );
}
