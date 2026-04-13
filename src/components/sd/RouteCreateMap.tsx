import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SDDriver, SDOrderSummary } from "@/types/sd";

interface StopEntry {
  order_id: number;
  order_no: string;
  customer_name: string;
  delivery_address: string;
}

interface RouteCreateMapProps {
  drivers: SDDriver[];
  orders: SDOrderSummary[];
  stops: StopEntry[];
  selectedDriverId: string;
}

const ACCRA_CENTER: [number, number] = [5.6037, -0.1870];

export default function RouteCreateMap({
  drivers,
  orders,
  stops,
  selectedDriverId,
}: RouteCreateMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const isDark = document.documentElement.classList.contains("dark");
    const map = L.map(containerRef.current, {
      center: ACCRA_CENTER,
      zoom: 13,
      zoomControl: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer(
      isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19, attribution: "© OpenStreetMap contributors © CARTO" }
    ).addTo(map);
    markersRef.current.addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.clearLayers();
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    const bounds: L.LatLngExpression[] = [];

    // Driver markers — blue circles
    drivers.forEach((d) => {
      if (!d.current_lat || !d.current_lng) return;
      const isSelected = String(d.id) === selectedDriverId;
      const marker = L.marker([d.current_lat, d.current_lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="
            width:${isSelected ? 28 : 22}px;height:${isSelected ? 28 : 22}px;
            border-radius:50%;
            background:hsl(221 83% 53%);
            border:3px solid ${isSelected ? "hsl(45 93% 47%)" : "white"};
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 6px rgba(0,0,0,.35);
          "><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>`,
          iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
          iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
        }),
      });
      marker.bindTooltip(d.name, { direction: "top", offset: [0, -14] });
      markersRef.current.addLayer(marker);
      bounds.push([d.current_lat, d.current_lng]);
    });

    // Order markers — confirmed orders as orange pins, stops as green numbered
    const stopOrderIds = new Set(stops.map((s) => s.order_id));

    orders.forEach((o) => {
      if (!o.delivery_lat || !o.delivery_lng) return;
      const isStop = stopOrderIds.has(o.id);
      const stopIndex = isStop
        ? stops.findIndex((s) => s.order_id === o.id)
        : -1;

      const marker = L.marker([o.delivery_lat, o.delivery_lng], {
        icon: L.divIcon({
          className: "",
          html: isStop
            ? `<div style="
                width:26px;height:26px;border-radius:50%;
                background:hsl(142 71% 45%);
                border:2px solid white;
                display:flex;align-items:center;justify-content:center;
                color:white;font-weight:700;font-size:12px;
                box-shadow:0 2px 6px rgba(0,0,0,.3);
              ">${stopIndex + 1}</div>`
            : `<div style="
                width:20px;height:20px;border-radius:50%;
                background:hsl(25 95% 53%);
                border:2px solid white;
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 2px 4px rgba(0,0,0,.25);
              "><svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/></svg></div>`,
          iconSize: isStop ? [26, 26] : [20, 20],
          iconAnchor: isStop ? [13, 13] : [10, 10],
        }),
      });
      const label = o.partner_name || o.unregistered_customer_name || o.order_no;
      marker.bindTooltip(
        `${o.order_no} — ${label}`,
        { direction: "top", offset: [0, -12] }
      );
      markersRef.current.addLayer(marker);
      bounds.push([o.delivery_lat, o.delivery_lng]);
    });

    // Draw route line through stops in order
    if (stops.length >= 2) {
      const lineCoords: L.LatLngExpression[] = [];
      // If a driver is selected, start from driver position
      const selectedDriver = drivers.find(
        (d) => String(d.id) === selectedDriverId
      );
      if (selectedDriver?.current_lat && selectedDriver?.current_lng) {
        lineCoords.push([selectedDriver.current_lat, selectedDriver.current_lng]);
      }
      stops.forEach((s) => {
        const order = orders.find((o) => o.id === s.order_id);
        if (order?.delivery_lat && order?.delivery_lng) {
          lineCoords.push([order.delivery_lat, order.delivery_lng]);
        }
      });
      if (lineCoords.length >= 2) {
        routeLineRef.current = L.polyline(lineCoords, {
          color: "hsl(142 71% 45%)",
          weight: 3,
          dashArray: "8 6",
          opacity: 0.8,
        }).addTo(map);
      }
    }

    // Fit bounds
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds as L.LatLngTuple[]), {
        padding: [40, 40],
        maxZoom: 14,
      });
    }
  }, [drivers, orders, stops, selectedDriverId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg border border-border overflow-hidden"
    />
  );
}
