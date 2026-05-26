interface GPSStatusProps {
  loading: boolean;
  error: string | null;
}

export default function GPSStatus({ loading, error }: GPSStatusProps) {
  if (!loading && !error) return null;

  return (
    <>
      {loading && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-sm shadow">
          Localisation en cours...
        </div>
      )}
      {error && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-red-100 px-4 py-2 text-sm text-red-700 shadow">
          {error}
        </div>
      )}
    </>
  );
}
