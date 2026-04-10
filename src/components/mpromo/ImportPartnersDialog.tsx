import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Upload, CheckCircle2, XCircle, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { createPartner } from "@/lib/api/mpromo";
import type { MPromoScope } from "@/types/mpromo";

interface ImportPartnersDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scope?: MPromoScope;
  onSuccess: () => void;
}

interface ParsedRow {
  rowNum: number;
  name: string;
  phone: string;
  type: string;
  location: string;
  latitude: string;
  longitude: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  row: ParsedRow;
  success: boolean;
  error?: string;
}

type Step = "upload" | "preview" | "importing" | "done";

const PHONE_RE = /^0[2-9]\d{8}$/;
const VALID_TYPES = ["CHILLER", "ICE_WATER_SELLER"];

function validateRow(fields: string[], rowNum: number): ParsedRow {
  const [name = "", phone = "", type = "", location = "", lat = "", lng = ""] = fields.map((f) => f.trim());
  const errors: string[] = [];

  if (!name) errors.push("name required");
  if (!phone) errors.push("phone required");
  else if (!PHONE_RE.test(phone)) errors.push("invalid phone format");
  if (!VALID_TYPES.includes(type)) errors.push("type must be CHILLER or ICE_WATER_SELLER");
  if (!location) errors.push("location required");
  if (lat) {
    const n = Number(lat);
    if (isNaN(n) || n < -90 || n > 90) errors.push("latitude must be -90..90");
  }
  if (lng) {
    const n = Number(lng);
    if (isNaN(n) || n < -180 || n > 180) errors.push("longitude must be -180..180");
  }

  return {
    rowNum,
    name,
    phone,
    type,
    location,
    latitude: lat,
    longitude: lng,
    valid: errors.length === 0,
    error: errors.join("; "),
  };
}

function downloadTemplate() {
  const lines = [
    "name,phone,type,location,latitude,longitude",
    "# name=required | phone=required 10-digit Ghana mobile (0XXXXXXXXX) | type=CHILLER or ICE_WATER_SELLER | location=required | latitude/longitude=optional decimal degrees",
    "Kwame Mensah,0244123456,CHILLER,Kaneshie Market,,",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "partner_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportPartnersDialog({ open, onOpenChange, scope, onSuccess }: ImportPartnersDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const hadSuccess = useRef(false);

  const reset = useCallback(() => {
    setStep("upload");
    setRows([]);
    setImportProgress(0);
    setResults([]);
    hadSuccess.current = false;
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleOpenChange = (v: boolean) => {
    if (!v && step === "importing") return; // prevent closing during import
    if (!v) {
      if (hadSuccess.current) onSuccess();
      reset();
    }
    onOpenChange(v);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
      // skip header
      const dataLines = lines.slice(1);
      const parsed = dataLines.map((line, i) => validateRow(line.split(","), i + 2));
      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const validRows = rows.filter((r) => r.valid);
  const errorRows = rows.filter((r) => !r.valid);

  const handleImport = async () => {
    setStep("importing");
    setImportProgress(0);
    const importResults: ImportResult[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await createPartner(
          {
            name: row.name,
            phone: row.phone,
            type: row.type as "CHILLER" | "ICE_WATER_SELLER",
            location: row.location,
            ...(row.latitude ? { latitude: Number(row.latitude) } : {}),
            ...(row.longitude ? { longitude: Number(row.longitude) } : {}),
          },
          scope
        );
        importResults.push({ row, success: true });
        hadSuccess.current = true;
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "Unknown error";
        importResults.push({ row, success: false, error: msg });
      }
      setImportProgress(i + 1);
    }

    setResults(importResults);
    setStep("done");
  };

  const successCount = results.filter((r) => r.success).length;
  const failedResults = results.filter((r) => !r.success);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import Partners"}
            {step === "preview" && "Review Import"}
            {step === "importing" && "Importing..."}
            {step === "done" && "Import Complete"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 — Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">CSV columns (in order):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>name</strong> — required, partner display name</li>
                <li><strong>phone</strong> — required, Ghana mobile (e.g. 0244123456)</li>
                <li><strong>type</strong> — required, CHILLER or ICE_WATER_SELLER</li>
                <li><strong>location</strong> — required, area description</li>
                <li><strong>latitude</strong> — optional, decimal degrees (-90 to 90)</li>
                <li><strong>longitude</strong> — optional, decimal degrees (-180 to 180)</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
                <Download className="h-4 w-4" /> Download Template
              </Button>
            </div>

            <label className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 cursor-pointer hover:border-primary/50 transition-colors">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to select a .csv file</span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          </div>
        )}

        {/* STEP 2 — Preview */}
        {step === "preview" && (
          <div className="space-y-4 min-h-0 flex flex-col">
            <p className="text-sm">
              <span className="text-[hsl(var(--success))] font-medium">{validRows.length} ready</span>
              {errorRows.length > 0 && (
                <span className="text-destructive font-medium ml-2">{errorRows.length} with errors</span>
              )}
            </p>

            <div className="overflow-y-auto max-h-80 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-16">Lat</TableHead>
                    <TableHead className="w-16">Lng</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.rowNum}>
                      <TableCell className="text-muted-foreground">{row.rowNum}</TableCell>
                      <TableCell>{row.name || "—"}</TableCell>
                      <TableCell>{row.phone || "—"}</TableCell>
                      <TableCell>{row.type || "—"}</TableCell>
                      <TableCell>{row.location || "—"}</TableCell>
                      <TableCell>{row.latitude || "—"}</TableCell>
                      <TableCell>{row.longitude || "—"}</TableCell>
                      <TableCell>
                        {row.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                        ) : (
                          <span className="flex items-start gap-1 text-destructive text-xs">
                            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            {row.error}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setStep("upload"); setRows([]); if (fileRef.current) fileRef.current.value = ""; }}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={validRows.length === 0} className="gap-1.5">
                <Upload className="h-4 w-4" /> Import {validRows.length} Partners
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Importing */}
        {step === "importing" && (
          <div className="space-y-4 py-4">
            <Progress value={(importProgress / validRows.length) * 100} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              Importing partner {importProgress} of {validRows.length}...
            </p>
          </div>
        )}

        {/* STEP 4 — Done */}
        {step === "done" && (
          <div className="space-y-4 min-h-0 flex flex-col">
            <p className="text-sm">
              <span className="text-[hsl(var(--success))] font-medium">{successCount} imported successfully</span>
              {failedResults.length > 0 && (
                <span className="text-destructive font-medium ml-2">{failedResults.length} failed</span>
              )}
            </p>

            {failedResults.length > 0 && (
              <div className="overflow-y-auto max-h-60 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedResults.map((r) => (
                      <TableRow key={r.row.rowNum}>
                        <TableCell>{r.row.name}</TableCell>
                        <TableCell>{r.row.phone}</TableCell>
                        <TableCell className="text-destructive text-xs">{r.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
