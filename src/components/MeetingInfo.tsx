interface MeetingInfoProps {
  pedestrianTimeSec: number;
  vehicleTimeSec: number;
  computing: boolean;
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
}: MeetingInfoProps) {
  if (computing) {
    return (
      <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-white px-4 py-2 shadow-lg">
        <span className="text-sm text-gray-600">Calcul du point de rencontre...</span>
      </div>
    );
  }

  return (
    <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-white px-4 py-3 shadow-lg">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
          <span className="font-medium">Vous :</span>
          <span>{formatTime(pedestrianTimeSec)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
          <span className="font-medium">Véhicule :</span>
          <span>{formatTime(vehicleTimeSec)}</span>
        </div>
      </div>
    </div>
  );
}
