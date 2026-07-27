function escapeCsvField(value: string): string {
  if (/[",;\n\r\t]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function formatExcelText(value: string): string {
  if (!value) {
    return "";
  }

  return `\t${value}`;
}

export function splitDateTime(datetime: string): { date: string; time: string } {
  const [date, time] = datetime.split(" ");

  return {
    date: date ?? "",
    time: time ? time.slice(0, 5) : "",
  };
}

function buildCsvContent(rows: string[][]): string {
  const bom = "\uFEFF";
  const body = rows
    .map((row) => row.map(escapeCsvField).join(";"))
    .join("\r\n");

  return `${bom}${body}`;
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const content = buildCsvContent(rows);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string;
}

export function downloadTableCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[]
): void {
  const header = columns.map((column) => column.label);
  const data = rows.map((row) => columns.map((column) => column.value(row)));

  downloadCsv(filename, [header, ...data]);
}
