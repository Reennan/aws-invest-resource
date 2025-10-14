import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface RealtimeData {
  event: string;
  table: string;
  schema: string;
  new: any;
  old: any;
}

export const useRealtime = (onDataChange?: (data: RealtimeData) => void) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) {
      setConnected(false);
      return;
    }

    setConnected(true);

    // Polling a cada 30 segundos para simular realtime
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      if (onDataChange) {
        onDataChange({
          event: 'UPDATE',
          table: 'polling',
          schema: 'public',
          new: {},
          old: {}
        });
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      setConnected(false);
    };
  }, [user, onDataChange]);

  return {
    connected,
    lastUpdate,
  };
};