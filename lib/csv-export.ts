export interface CsvColumn {
  key: string;
  label: string;
}

export function toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]) {
  const header = ["id", ...columns.map((c) => c.label)];
  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = rows.map((row) => [escape(row.id), ...columns.map((c) => escape(row[c.key]))].join(","));
  return [header.map(escape).join(","), ...lines].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
