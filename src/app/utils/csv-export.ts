export function exportToCsv(headers: string[], rows: (string | number)[][], filename: string): void {
  const headerLine = headers.join(',');
  const body = rows
    .map((row) => row.map((value) => `"${String(value)}"`).join(','))
    .join('\n');
  const content = [headerLine, body].filter(Boolean).join('\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

