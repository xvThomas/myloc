import type { LatLng } from "../types/geo";

interface CenterButtonProps {
  position: LatLng | null;
  onRecenter: () => void;
}

export default function CenterButton({ position, onRecenter }: CenterButtonProps) {
  if (!position) return null;

  return (
    <button
      onClick={onRecenter}
      className="absolute bottom-6 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg active:bg-gray-100"
      aria-label="Recentrer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-blue-600">
        <path
          fillRule="evenodd"
          d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
