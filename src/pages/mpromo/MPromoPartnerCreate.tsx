import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, LocateFixed, MapPin } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPickerModal } from "@/components/mpromo/MapPickerModal";
import { useMPromoScope } from "@/providers/MPromoScopeProvider";
import { createPartner } from "@/lib/api/mpromo";
import type { PartnerType } from "@/types/mpromo";

const partnerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .max(20, "Phone number is too long")
    .regex(/^[+\d\s()-]+$/, "Enter a valid phone number"),
  type: z.enum(["CHILLER", "ICE_WATER_SELLER"], {
    required_error: "Select a partner type",
  }),
  location: z.string().trim().min(1, "Location is required").max(200, "Location must be under 200 characters"),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

function LocationPreviewMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([latitude, longitude], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    L.marker([latitude, longitude]).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 50);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="h-[180px] w-full rounded-md overflow-hidden border border-border relative z-0"
    />
  );
}

export default function MPromoPartnerCreate() {
  const navigate = useNavigate();
  const { scope } = useMPromoScope();

  const [mapOpen, setMapOpen] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      phone: "",
      type: "CHILLER",
      location: "",
    },
  });

  const handleCaptureLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        toast.success("Location captured");
      },
      () => toast.error("Unable to get current location"),
    );
  };

  const handleMapPick = (picked: { latitude: number; longitude: number }) => {
    setCoords(picked);
    setMapOpen(false);
    toast.success("Location picked from map");
  };

  const onSubmit = async (values: PartnerFormValues) => {
    setIsSaving(true);
    try {
      await createPartner(
        {
          name: values.name,
          phone: values.phone,
          type: values.type as PartnerType,
          location: values.location,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        },
        scope,
      );
      toast.success("Partner created successfully");
      navigate("/mpromo/partners");
    } catch {
      toast.error("Failed to create partner");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/mpromo/partners")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Partners
      </Button>

      <h2 className="text-xl font-bold text-foreground">Add New Partner</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Partner Details</CardTitle>
              <p className="text-xs text-destructive mt-1">* required</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Kwame's Chiller Spot" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +233 24 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner Type <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CHILLER">Chiller</SelectItem>
                        <SelectItem value="ICE_WATER_SELLER">Ice Water Seller</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Accra, Osu Market" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Geolocation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Geolocation (optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {coords ? (
                <>
                  <LocationPreviewMap latitude={coords.latitude} longitude={coords.longitude} />
                  <p className="text-sm text-foreground">
                    Lat: {coords.latitude.toFixed(6)}, Lng: {coords.longitude.toFixed(6)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No location set yet</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button type="button" variant="outline" size="sm" onClick={handleCaptureLocation}>
                  <LocateFixed className="h-4 w-4 mr-1.5" /> Use my current location
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setMapOpen(true)}>
                  <MapPin className="h-4 w-4 mr-1.5" /> Pick on map
                </Button>
                {coords && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCoords(null)}>
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/mpromo/partners")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-1.5">
              <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Partner"}
            </Button>
          </div>
        </form>
      </Form>

      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapPick}
        initialLat={coords?.latitude ?? 5.6037}
        initialLng={coords?.longitude ?? -0.187}
      />
    </div>
  );
}
