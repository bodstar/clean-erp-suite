import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

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
  initialLat = 6.5244,
  initialLng = 3.3792,
}: MapPickerModalProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );

  useEffect(() => {
    if (open && initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
    }
  }, [open, initialLat, initialLng]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pick Location on Map</DialogTitle>
        </DialogHeader>
        <div className="h-[350px] rounded-md overflow-hidden border border-border">
          <MapContainer
            center={[initialLat, initialLng]}
            zoom={12}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler
              onSelect={(lat, lng) => setPosition([lat, lng])}
            />
            {position && <Marker position={position} />}
          </MapContainer>
        </div>
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
