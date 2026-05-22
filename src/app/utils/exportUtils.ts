export function getDateStamp() {
  return new Date().toISOString().split("T")[0];
}

export function buildExportFilename(prefix: string, scope?: string) {
  const cleanScope = scope?.trim().replace(/\s+/g, "_");
  return [prefix, cleanScope, getDateStamp()].filter(Boolean).join("_");
}

export function downloadCSV(data: Record<string, any>[], filename: string) {
  if (!data || !data.length) return;

  const headers = Array.from(new Set(data.flatMap((row) => Object.keys(row))));
  const csvRows = [];

  // Agregar headers
  csvRows.push(headers.join(","));

  // Agregar filas
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] ?? "";
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL?.(url);
}

export function printPDF(
  title?: string,
  options: { printableSelector?: string; subtitle?: string } = {},
) {
  const previousTitle = document.title;
  const header = document.createElement("div");
  const style = document.createElement("style");
  const cleanup = () => {
    header.remove();
    style.remove();
    window.removeEventListener("afterprint", cleanup);
    document.title = previousTitle;
  };

  if (title) document.title = title;
  header.className = "sgp-print-header";
  header.innerHTML = `
    <strong>MTE - Modulo de Trazabilidad Estrategica</strong>
    <span>${options.subtitle ?? title ?? "Reporte"} - ${new Date().toLocaleString("es-CO")}</span>
  `;
  style.textContent = `
    .sgp-print-header { display: none; }
    .sgp-print-title { display: none; }
    @media print {
      @page { margin: 14mm 12mm; }
      body { background: #fff !important; }
      .sgp-print-header {
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 8px 0 10px;
        border-bottom: 1px solid #D9DEE8;
        font-family: Montserrat, Arial, sans-serif;
        color: #111827;
        background: #fff;
        z-index: 999999;
      }
      .sgp-print-header strong { font-size: 12px; }
      .sgp-print-header span { font-size: 10px; color: #555; }
      .sgp-print-title {
        display: block !important;
        margin: 0 0 12mm !important;
        padding: 0 0 5mm !important;
        border-bottom: 2px solid #111827 !important;
        color: #111827 !important;
        font-family: Montserrat, Arial, sans-serif !important;
      }
      .sgp-print-title small {
        display: block;
        margin-bottom: 3mm;
        color: #5454E9 !important;
        font-size: 9px !important;
        font-weight: 900 !important;
        letter-spacing: 0 !important;
        text-transform: uppercase !important;
      }
      .sgp-print-title h1 {
        margin: 0 !important;
        color: #111827 !important;
        font-size: 22px !important;
        font-weight: 900 !important;
        line-height: 1.1 !important;
      }
      .sgp-print-title p {
        margin: 3mm 0 0 !important;
        color: #717182 !important;
        font-size: 10px !important;
        line-height: 1.4 !important;
      }
      .sgp-print-avoid,
      .sgp-print-avoid tr,
      .sgp-print-avoid td,
      .sgp-print-avoid th {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .sgp-screen-only { display: none !important; }
      ${options.printableSelector ? `
      body * { visibility: hidden !important; }
      ${options.printableSelector},
      ${options.printableSelector} * { visibility: visible !important; }
      ${options.printableSelector} {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        min-height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        background: #fff !important;
        overflow: visible !important;
      }
      ` : ""}
      button, nav, aside { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      * {
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
    }
  `;
  document.body.appendChild(header);
  document.head.appendChild(style);
  window.addEventListener("afterprint", cleanup);
  window.print();
  setTimeout(cleanup, 500);
}
