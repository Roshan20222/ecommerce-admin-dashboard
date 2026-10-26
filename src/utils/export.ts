import { unparse } from 'papaparse'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
): void {
  const csv = unparse({
    fields: headers,
    data: rows,
  })
  downloadBlob(filename, new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
}

export function exportToPdf(
  title: string,
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
): void {
  const document = new jsPDF({ orientation: 'landscape' })
  document.setFontSize(16)
  document.text(title, 14, 16)
  document.setFontSize(9)
  document.text(`Exported ${new Date().toLocaleString()}`, 14, 23)
  autoTable(document, {
    head: [headers],
    body: rows.map((row) => row.map(String)),
    startY: 29,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  })
  document.save(filename)
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
