import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface RealtimeData {
  event: string;
  table: string;
  schema: string;
  new: any;
  old: any;
}

export const useRealtime = (onDataChange?: (data: RealtimeData) => void) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Realtime update:', payload);
    setLastUpdate(new Date());
    
    if (onDataChange) {
      onDataChange(payload);
    }

    // Show toast notification for important updates
    if (payload.table === 'runs' && payload.new) {
      toast({
        title: "Data Updated",
        description: `New run data available for cluster`,
        duration: 3000,
      });
    }
  }, [onDataChange, toast]);

  useEffect(() => {
    if (!session) return;

    console.log('Setting up realtime connection...');
    
    // Subscribe to the resources channel
    const channel = supabase
      .channel('topic:resources')
      .on('broadcast', { event: '*' }, (payload: any) => {
        handleRealtimeUpdate(payload);
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          toast({
            title: "Connected",
            description: "Real-time updates enabled",
            duration: 2000,
          });
        } else if (status === 'CHANNEL_ERROR') {
          toast({
            title: "Connection Error",
            description: "Failed to connect to real-time updates",
            variant: "destructive",
            duration: 3000,
          });
        }
      });

    return () => {
      console.log('Cleaning up realtime connection...');
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [session, handleRealtimeUpdate, toast]);

  return {
    connected,
    lastUpdate,
  };
};