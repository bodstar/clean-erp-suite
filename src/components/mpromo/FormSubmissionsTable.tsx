import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FormDefinition, FormSubmission } from "@/types/market-data";

interface FormSubmissionsTableProps {
  form: FormDefinition;
  submissions: FormSubmission[];
  showPartner?: boolean;
}

function formatValue(value: any, type: string): string {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "checkbox") return value ? "Yes" : "No";
  if (type === "number") return Number(value).toLocaleString();
  return String(value);
}

export function FormSubmissionsTable({ form, submissions, showPartner = true }: FormSubmissionsTableProps) {
  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  if (submissions.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No submissions yet.</p>;
  }

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showPartner && <TableHead>Partner</TableHead>}
            <TableHead>Date</TableHead>
            {sortedFields.map((f) => (
              <TableHead key={f.id}>{f.label}</TableHead>
            ))}
            <TableHead>Submitted By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => (
            <TableRow key={sub.id}>
              {showPartner && (
                <TableCell className="font-medium whitespace-nowrap">{sub.partner_name}</TableCell>
              )}
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {sub.submitted_at}
              </TableCell>
              {sortedFields.map((f) => (
                <TableCell key={f.id}>
                  {formatValue(sub.values[f.id], f.type)}
                </TableCell>
              ))}
              <TableCell className="text-muted-foreground">{sub.submitted_by}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
