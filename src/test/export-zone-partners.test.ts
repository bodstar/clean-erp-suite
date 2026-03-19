import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AreaZone } from "@/types/area-zone";

// Mock zone data
const mockZone: AreaZone = {
  id: "z1",
  label: "Zone A",
  color: "#6366f1",
  shapeMode: "rectangle",
  layer: null,
  drawingLayers: [],
  polygonPointCount: 4,
  polygonEndMode: "count",
  partners: [
    {
      id: 1,
      name: "Partner One",
      type: "RETAIL_SHOP",
      status: "active",
      location: "Accra, Ghana",
      phone: "+233123456789",
      latitude: 5.6037,
      longitude: -0.1870,
      redemptions_count: 10,
      redemptions_amount: 5000,
      orders_count: 3,
      orders_amount: 12000,
      pending_payouts_count: 1,
      pending_payouts_amount: 2000,
      loyalty_points: 150,
      last_activity: "2026-03-19",
    },
    {
      id: 2,
      name: "Partner Two",
      type: "CHILLER",
      status: "inactive",
      location: "Kumasi, Ghana",
      phone: "+233987654321",
      latitude: 6.6885,
      longitude: -1.6244,
      redemptions_count: 5,
      redemptions_amount: 2500,
      orders_count: 1,
      orders_amount: 8000,
      pending_payouts_count: 0,
      pending_payouts_amount: 0,
      loyalty_points: 80,
      last_activity: null,
    },
  ],
};

const emptyZone: AreaZone = {
  ...mockZone,
  id: "z2",
  label: "Zone B",
  partners: [],
};

describe("exportZonesCSV", () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and DOM methods
    global.URL.createObjectURL = vi.fn(() => "blob:mock");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("generates valid CSV content with correct headers and rows", async () => {
    const { exportZonesCSV } = await import("@/lib/export-zone-partners");

    let capturedBlob: Blob | null = null;
    const mockClick = vi.fn();
    const mockAppendChild = vi.spyOn(document.body, "appendChild").mockImplementation((el) => {
      if (el instanceof HTMLAnchorElement) {
        mockClick();
      }
      return el;
    });
    const mockRemoveChild = vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);

    // Capture the blob
    global.URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock";
    });

    exportZonesCSV([mockZone]);

    expect(capturedBlob).not.toBeNull();
    const text = await capturedBlob!.text();

    // Check headers
    expect(text).toContain("Zone,Name,Type,Status,Location,Phone,Redemptions,Orders,Payouts,Loyalty Points,Last Activity");
    // Check data rows
    expect(text).toContain('"Zone A"');
    expect(text).toContain('"Partner One"');
    expect(text).toContain('"Partner Two"');
    // Check proper escaping
    expect(text.split("\n").length).toBe(3); // header + 2 rows

    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });

  it("handles empty zones gracefully", async () => {
    const { exportZonesCSV } = await import("@/lib/export-zone-partners");

    let capturedBlob: Blob | null = null;
    global.URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock";
    });
    vi.spyOn(document.body, "appendChild").mockImplementation((el) => el);
    vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);

    exportZonesCSV([emptyZone]);

    const text = await capturedBlob!.text();
    // Only header, no data rows
    expect(text.split("\n").length).toBe(1);
  });
});

describe("exportZonesExcel", () => {
  it("does not crash with empty zones", async () => {
    const { exportZonesExcel } = await import("@/lib/export-zone-partners");
    // This should not throw even with no partners
    await expect(exportZonesExcel([emptyZone])).resolves.not.toThrow();
  });
});
