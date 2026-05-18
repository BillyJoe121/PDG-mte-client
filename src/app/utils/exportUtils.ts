export function getDateStamp() {
  return new Date().toISOString().split("T")[0];
}

export function buildExportFilename(prefix: string, scope?: string) {
  const cleanScope = scope?.trim().replace(/\s+/g, "_");
  return [prefix, cleanScope, getDateStamp()].filter(Boolean).join("_");
}

export function downloadCSV(data: Record<string, any>[], filename: string) {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Agregar headers
  csvRows.push(headers.join(","));

  // Agregar filas
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
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
}

export function printPDF(title?: string) {
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
    <strong>SGP - Escuela TDI</strong>
    <span>${title ?? "Reporte"} - ${new Date().toLocaleString("es-CO")}</span>
  `;
  style.textContent = `
    .sgp-print-header { display: none; }
    @media print {
      @page { margin: 16mm 12mm; }
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
        border-bottom: 2px solid #000;
        font-family: Montserrat, Arial, sans-serif;
        color: #000;
        background: #fff;
        z-index: 999999;
      }
      .sgp-print-header strong { font-size: 12px; }
      .sgp-print-header span { font-size: 10px; color: #555; }
      button, nav, aside { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  `;
  document.body.appendChild(header);
  document.head.appendChild(style);
  window.addEventListener("afterprint", cleanup);
  window.print();
  setTimeout(cleanup, 500);
}
