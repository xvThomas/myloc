interface MeetingInfoProps {
  pedestrianTimeSec: number;
  vehicleTimeSec: number;
  computing: boolean;
  routeLabel?: string;
  selected?: boolean;
  onClick?: () => void;
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  if (min === 0) return `${sec}s`;
  return `${min}min ${sec}s`;
}

export default function MeetingInfo({
  pedestrianTimeSec,
  vehicleTimeSec,
  computing,
  routeLabel,
  selected = false,
  onClick,
}: MeetingInfoProps) {
  const bgClass = selected ? "bg-blue-50 ring-2 ring-blue-400" : "bg-white";

  if (computing) {
    return (
      <div className={`rounded-lg px-3 py-2 shadow-lg cursor-pointer ${bgClass}`} onClick={onClick}>
        <span className="text-xs text-gray-600">
          {routeLabel ? `${routeLabel} — ` : ""}Calcul du point de rencontre...
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg px-3 py-2 shadow-lg cursor-pointer ${bgClass}`} onClick={onClick}>
      {routeLabel && (
        <div className="mb-1 text-xs font-semibold text-gray-500">{routeLabel}</div>
      )}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span className="font-medium">Vous :</span>
          <span>{formatTime(pedestrianTimeSec)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />
          <span className="font-medium">Véhicule :</span>
          <span>{formatTime(vehicleTimeSec)}</span>
        </div>
      </div>
    </div>
  );
}
