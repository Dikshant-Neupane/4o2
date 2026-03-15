import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import useNotificationStore from '../store/notificationStore';

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws';
const MAX_RECONNECT = 5;

const useWebSocket = (userId) => {
  const wsRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const { addNotification } = useNotificationStore();

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[WS] Message:', data);

      switch (data.type) {
        case 'NEARBY_ALERT':
          toast.error(data.message || 'New issue reported near you!');
          addNotification({
            id: Date.now(),
            type: 'NEARBY_ALERT',
            message: data.message,
            timestamp: new Date().toISOString(),
            read: false,
          });
          break;

        case 'REPORT_VERIFIED':
          toast.success(data.message || 'Your report has been verified!');
          addNotification({
            id: Date.now(),
            type: 'REPORT_VERIFIED',
            message: data.message,
            timestamp: new Date().toISOString(),
            read: false,
          });
          break;

        case 'CLUSTER_ALERT':
          toast(data.message || 'Cluster detected in your area', {
            icon: '⚠️',
            style: { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' },
          });
          addNotification({
            id: Date.now(),
            type: 'CLUSTER_ALERT',
            message: data.message,
            timestamp: new Date().toISOString(),
            read: false,
          });
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('[WS] Parse error:', err);
    }
  }, [addNotification]);

  const connect = useCallback(() => {
    if (!userId) return;

    console.log('[WS] Connecting:', userId);
    const url = `${WS_BASE}/${userId}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] ✅ Connected');
        reconnectCountRef.current = 0;
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        console.warn('[WS] Disconnected');
        wsRef.current = null;

        if (reconnectCountRef.current < MAX_RECONNECT) {
          reconnectCountRef.current += 1;
          console.warn('[WS] Reconnecting... attempt', reconnectCountRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
    }
  }, [userId, handleMessage]);

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [userId, connect]);

  return wsRef;
};

export default useWebSocket;
