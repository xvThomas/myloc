import type { RouteResult, RoutePortion, RouteStep } from "./routeService";
import type { LatLng } from "../types/geo";

export type StepItemType = "depart" | "waypoint" | "step" | "arrival";

export interface StepItem {
  type: StepItemType;
  label: string;
  streetName: string | null;
  distanceDuration: string | null;
  position: LatLng;
  portionIndex: number;
  stepIndex: number; // -1 for headers, -2 for arrival
  globalStepNumber: number | null; // sequential number for regular steps
}

const INSTRUCTION_TYPES: Record<string, string> = {
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

const INSTRUCTION_MODIFIERS: Record<string, string> = {
  left: "à gauche",
  right: "à droite",
  "sharp left": "fortement à gauche",
  "sharp right": "fortement à droite",
  "slight left": "légèrement à gauche",
  "slight right": "légèrement à droite",
  straight: "tout droit",
  uturn: "demi-tour",
};

function instructionLabel(instruction: { type: string; modifier?: string }): string {
  const typeStr = INSTRUCTION_TYPES[instruction.type] || instruction.type;
  const modStr = instruction.modifier ? INSTRUCTION_MODIFIERS[instruction.modifier] || instruction.modifier : "";
  return modStr ? `${typeStr} ${modStr}` : typeStr;
}

function extractStreetName(attributes?: { name?: { nom_1_gauche?: string; nom_1_droite?: string } }): string | null {
  if (!attributes?.name) return null;
  return attributes.name.nom_1_gauche || attributes.name.nom_1_droite || null;
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

function stepPosition(step: RouteStep): LatLng {
  const coords = step.geometry.coordinates as [number, number][];
  return { lng: coords[0]![0], lat: coords[0]![1] };
}

/**
 * Build step items from RouteResult.portions[] (grouped by portion with headers).
 */
export function buildStepItemsFromPortions(portions: RoutePortion[]): StepItem[] {
  const items: StepItem[] = [];
  let globalStepNumber = 0;

  for (let portionIndex = 0; portionIndex < portions.length; portionIndex++) {
    const portion = portions[portionIndex]!;
    const isFirstPortion = portionIndex === 0;
    const isLastPortion = portionIndex === portions.length - 1;

    // Portion header
    if (isFirstPortion) {
      items.push({
        type: "depart",
        label: "Départ",
        streetName: null,
        distanceDuration: formatDistanceDuration(portion.distance, portion.duration),
        position: portion.start,
        portionIndex,
        stepIndex: -1,
        globalStepNumber: null,
      });
    } else {
      const firstStep = portion.steps[0];
      items.push({
        type: "waypoint",
        label: `Étape ${portionIndex}`,
        streetName: extractStreetName(firstStep?.attributes),
        distanceDuration: formatDistanceDuration(portion.distance, portion.duration),
        position: portion.start,
        portionIndex,
        stepIndex: -1,
        globalStepNumber: null,
      });
    }

    // Steps within this portion
    const stepsToRender = isLastPortion
      ? portion.steps
      : portion.steps.filter((s) => s.instruction.type !== "arrive");

    for (let stepIndex = 0; stepIndex < stepsToRender.length; stepIndex++) {
      // Skip first step of non-first portions (merged into waypoint header)
      if (!isFirstPortion && stepIndex === 0) continue;

      const step = stepsToRender[stepIndex]!;
      globalStepNumber++;
      items.push({
        type: "step",
        label: instructionLabel(step.instruction),
        streetName: extractStreetName(step.attributes),
        distanceDuration: formatDistanceDuration(step.distance, step.duration),
        position: stepPosition(step),
        portionIndex,
        stepIndex,
        globalStepNumber,
      });
    }
  }

  // Arrival
  const lastPortion = portions[portions.length - 1]!;
  const totalDistance = portions.reduce((sum, p) => sum + p.distance, 0);
  const totalDuration = portions.reduce((sum, p) => sum + p.duration, 0);
  items.push({
    type: "arrival",
    label: "Arrivée",
    streetName: null,
    distanceDuration: formatDistanceDuration(totalDistance, totalDuration),
    position: lastPortion.end,
    portionIndex: portions.length - 1,
    stepIndex: -2,
    globalStepNumber: null,
  });

  return items;
}

/**
 * Build step items from RouteResult.steps[] (flat list, no portion grouping).
 */
export function buildStepItemsFromFlatSteps(route: RouteResult): StepItem[] {
  const items: StepItem[] = [];

  // Depart header
  items.push({
    type: "depart",
    label: "Départ",
    streetName: null,
    distanceDuration: formatDistanceDuration(route.distance, route.duration),
    position: route.start,
    portionIndex: 0,
    stepIndex: -1,
    globalStepNumber: null,
  });

  // All steps sequentially
  let globalStepNumber = 0;
  for (let i = 0; i < route.steps.length; i++) {
    const step = route.steps[i]!;
    // Skip arrive steps that are not the very last one
    // if (step.instruction.type === "arrive" && i < route.steps.length - 1) continue;
    // Skip the final arrive step (handled by arrival item)
    //if (step.instruction.type === "arrive" && i === route.steps.length - 1) continue;

    globalStepNumber++;
    items.push({
      type: "step",
      label: instructionLabel(step.instruction),
      streetName: extractStreetName(step.attributes),
      distanceDuration: formatDistanceDuration(step.distance, step.duration),
      position: stepPosition(step),
      portionIndex: 0,
      stepIndex: i,
      globalStepNumber,
    });
  }

  // Arrival
  items.push({
    type: "arrival",
    label: "Arrivée",
    streetName: null,
    distanceDuration: formatDistanceDuration(route.distance, route.duration),
    position: route.end,
    portionIndex: 0,
    stepIndex: -2,
    globalStepNumber: null,
  });

  return items;
}
