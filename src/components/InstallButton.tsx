interface InstallButtonProps {
  canInstall: boolean;
  onInstall: () => void;
}

export default function InstallButton({ canInstall, onInstall }: InstallButtonProps) {
  if (!canInstall) return null;

  return (
    <button
      onClick={onInstall}
      className="absolute left-4 top-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg active:bg-blue-700"
    >
      Installer l'app
    </button>
  );
}
