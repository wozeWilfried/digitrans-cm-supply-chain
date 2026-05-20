import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Wifi, WifiOff, CloudOff, UploadCloud } from 'lucide-react';

export function NetworkIndicator() {
  const isOnline = useOnlineStatus();
  const { count } = useOfflineQueue();

  if (isOnline && count === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600">
        <Wifi size={12} />
        <span>En ligne</span>
      </div>
    );
  }

  if (isOnline && count > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 animate-pulse">
        <UploadCloud size={12} />
        <span>{count} en synchronisation…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <WifiOff size={12} />
      <span>Hors ligne {count > 0 ? `— ${count} action(s) en attente` : '(mode dégradé)'}</span>
    </div>
  );
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { count } = useOfflineQueue();

  if (isOnline && count === 0) return null;

  return (
    <div className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium
      ${isOnline ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'}`}>
      {isOnline ? (
        <>
          <UploadCloud size={13} />
          Synchronisation en cours — {count} action(s) en attente de connexion
        </>
      ) : (
        <>
          <CloudOff size={13} />
          Mode hors ligne — Les données sont mises en cache localement et seront synchronisées à la reconnexion
        </>
      )}
    </div>
  );
}
