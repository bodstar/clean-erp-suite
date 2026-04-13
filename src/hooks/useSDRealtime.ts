// Required env vars for production WebSocket:
// VITE_REVERB_APP_KEY=your-reverb-app-key
// VITE_REVERB_HOST=your-reverb-host
// VITE_REVERB_PORT=8080
// VITE_REVERB_SCHEME=http

import { useEffect, useRef, useCallback } from "react";

const DEMO_MODE = !import.meta.env.VITE_API_BASE_URL;

interface UseSDRealtimeOptions {
  teamId: number;
  onDriverLocationUpdate: (driverId: number, lat: number, lng: number) => void;
  enabled: boolean;
}

export function useSDRealtime({ teamId, onDriverLocationUpdate, enabled }: UseSDRealtimeOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const echoRef = useRef<unknown>(null);

  const startSimulation = useCallback(() => {
    intervalRef.current = setInterval(() => {
      // Driver 1 — moving toward Tema Station (east)
      onDriverLocationUpdate(
        1,
        5.6037 + (Math.random() - 0.3) * 0.002,
        -0.1870 + (Math.random() + 0.1) * 0.002
      );
      // Driver 2 — stationary with small jitter
      onDriverLocationUpdate(
        2,
        5.5913 + (Math.random() - 0.5) * 0.0005,
        -0.2068 + (Math.random() - 0.5) * 0.0005
      );
    }, 3000);
  }, [onDriverLocationUpdate]);

  const startEcho = useCallback(async () => {
    try {
      const [{ default: Echo }, { default: Pusher }] = await Promise.all([
        import("laravel-echo"),
        import("pusher-js"),
      ]);

      const echo = new Echo({
        broadcaster: "reverb",
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
        enabledTransports: ["ws", "wss"],
        Pusher,
      });

      echo
        .private(`team.${teamId}.drivers`)
        .listen("DriverLocationUpdated", (e: { driver_id: number; latitude: number; longitude: number }) => {
          onDriverLocationUpdate(e.driver_id, e.latitude, e.longitude);
        });

      echoRef.current = echo;
    } catch (err) {
      console.warn("Reverb connection failed — real-time updates unavailable", err);
    }
  }, [teamId, onDriverLocationUpdate]);

  useEffect(() => {
    if (!enabled) return;

    if (DEMO_MODE) {
      startSimulation();
    } else {
      startEcho();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (echoRef.current && typeof (echoRef.current as Record<string, unknown>).disconnect === "function") {
        (echoRef.current as { disconnect: () => void }).disconnect();
      }
    };
  }, [enabled, startSimulation, startEcho]);
}
