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
    if (!session) {
      setConnected(false);
      return;
    }

    let channel: any = null;
    let isActive = true;

    const setupConnection = async () => {
      try {
        // Subscribe to the resources channel
        channel = supabase
          .channel('topic:resources')
          .on('broadcast', { event: '*' }, (payload: any) => {
            if (isActive) {
              handleRealtimeUpdate(payload);
            }
          })
          .subscribe((status) => {
            if (!isActive) return;
            
            setConnected(status === 'SUBSCRIBED');
            
            if (status === 'SUBSCRIBED') {
              // Only show toast once when first connecting
              if (!connected) {
                toast({
                  title: "Conectado",
                  description: "Atualizações em tempo real ativadas",
                  duration: 2000,
                });
              }
            } else if (status === 'CHANNEL_ERROR') {
              toast({
                title: "Erro de Conexão",
                description: "Falha ao conectar atualizações em tempo real",
                variant: "destructive",
                duration: 3000,
              });
            }
          });
      } catch (error) {
        console.error('Error setting up realtime connection:', error);
      }
    };

    setupConnection();

    return () => {
      isActive = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      setConnected(false);
    };
  }, [session]);

  return {
    connected,
    lastUpdate,
  };
};