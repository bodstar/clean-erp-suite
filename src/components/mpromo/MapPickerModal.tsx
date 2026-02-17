import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPickerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  initialLat?: number;
  initialLng?: number;
}

export function MapPickerModal({
  open,
  onClose,
  onConfirm,
  initialLat = 5.6037,
  initialLng = -0.187,
}: MapPickerModalProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (open && initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
    }
  }, [open, initialLat, initialLng]);

  // Initialize map when dialog opens
  useEffect(() => {
    if (!open) return;

    // Small delay to ensure the dialog DOM is rendered
    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      // Add initial marker if position exists
      if (initialLat && initialLng) {
        markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
      }

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
      });

      mapRef.current = map;

      // Force a resize after the dialog animation completes
      setTimeout(() => map.invalidateSize(), 100);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open, initialLat, initialLng]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pick Location on Map</DialogTitle>
        </DialogHeader>
        <div
          ref={mapContainerRef}
          className="h-[350px] rounded-md overflow-hidden border border-border"
        />
        {position && (
          <p className="text-xs text-muted-foreground">
            Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!position}
            onClick={() =>
              position &&
              onConfirm({ latitude: position[0], longitude: position[1] })
            }
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
