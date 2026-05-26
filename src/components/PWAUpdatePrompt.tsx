import { useMemo, useState } from "react";
import { registerSW } from "virtual:pwa-register";

export default function PWAUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  const updateServiceWorker = useMemo(
    () =>
      registerSW({
        immediate: true,
        onNeedRefresh() {
          setNeedRefresh(true);
        },
        onOfflineReady() {
          setOfflineReady(true);
        },
      }),
    []
  );

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-md rounded-xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
        <p className="text-sm text-slate-800">
          {needRefresh ? "Nouvelle version disponible" : "Application prete hors ligne"}
        </p>
        <div className="mt-2 flex gap-2">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white active:bg-blue-700"
            >
              Recharger
            </button>
          )}
          <button
            onClick={() => {
              setNeedRefresh(false);
              setOfflineReady(false);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 active:bg-slate-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
