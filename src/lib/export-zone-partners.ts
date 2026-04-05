/**
 * @module ExportZonePartners
 * Utilities for exporting advanced area selection zone data to CSV, Excel, and PDF.
 * Flattens zone→partner hierarchies into tabular rows with formatted metric values.
 */

import type { MapPartner } from "@/types/mpromo";
import type { AreaZone } from "@/types/area-zone";

interface ZoneExportData {
  zone: string;
  name: string;
  type: string;
  status: string;
  location: string;
  phone: string;
  redemptions: string;
  orders: string;
  payouts: string;
  loyalty_points: string;
  last_activity: string;
}

/** Flatten zone→partner hierarchy into exportable rows */
function flattenZones(zones: AreaZone[]): ZoneExportData[] {
  return zones.flatMap((z) =>
    z.partners.map((p) => ({
      zone: z.label,
      name: p.name,
      type: p.type.replace("_", " "),
      status: p.status,
      location: p.location,
      phone: p.phone,
      redemptions: `${p.redemptions_count} (GH₵${p.redemptions_amount.toLocaleString()})`,
      orders: `${p.orders_count} (GH₵${p.orders_amount.toLocaleString()})`,
      payouts: `${p.pending_payouts_count} (GH₵${p.pending_payouts_amount.toLocaleString()})`,
      loyalty_points: p.loyalty_points.toLocaleString(),
      last_activity: p.last_activity || "—",
    }))
  );
}

const HEADERS = [
  "Zone", "Name", "Type", "Status", "Location", "Phone",
  "Redemptions", "Orders", "Payouts", "Loyalty Points", "Last Activity",
];

/** Trigger a browser file download from a Blob */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export zone partners as a CSV file download */
export function exportZonesCSV(zones: AreaZone[]) {
  const rows = flattenZones(zones);
  const csvContent = [
    HEADERS.join(","),
    ...rows.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");
  downloadBlob(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), "zone-partners.csv");
}

/** Export zone partners as an Excel (.xlsx) file download using the xlsx library */
export async function exportZonesExcel(zones: AreaZone[]) {
  const XLSX = await import("xlsx");
  const rows = flattenZones(zones);
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: Object.keys(rows[0] || {}),
  });
  // Set header row to friendly names
  HEADERS.forEach((h, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws[cell]) ws[cell].v = h;
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Zone Partners");
  XLSX.writeFile(wb, "zone-partners.xlsx");
}

/** Export zone partners as a PDF file download using jsPDF with auto-table */
export async function exportZonesPDF(zones: AreaZone[]) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Zone Partners Export", 14, 15);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 21);

  const rows = flattenZones(zones);
  autoTable(doc, {
    startY: 26,
    head: [HEADERS],
    body: rows.map((r) => Object.values(r)),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [99, 102, 241] },
    alternateRowStyles: { fillColor: [245, 245, 250] },
  });

  doc.save("zone-partners.pdf");
}
