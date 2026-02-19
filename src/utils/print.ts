export interface PrintColumn {
    title: string
    key: string
}

export interface PrintOptions {
    title: string
    headerData?: Record<string, string>
    columns: PrintColumn[]
    rows: Record<string, any>[]
}

export function printTable(options: PrintOptions) {
    const { title, headerData = {}, columns, rows } = options

    const headerHtml = Object.entries(headerData)
        .map(([key, value]) => `
      <div class="header-item">
        <strong>${key}:</strong> ${value}
      </div>
    `)
        .join("")

    const tableHeader = columns
        .map(col => `<th>${col.title}</th>`)
        .join("")

    const tableRows = rows
        .map(row => `
      <tr>
        ${columns.map(col => `<td>${row[col.key] ?? ""}</td>`).join("")}
      </tr>
    `)
        .join("")

    const printWindow = window.open("", "", "width=1000,height=700")

    if (!printWindow) return

    printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            body {
              font-family: "Times New Roman", Arial, sans-serif;
              direction: rtl;
            }

            .print-header {
              text-align: center;
              margin-bottom: 20px;
            }

            .report-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 10px;
            }

            .header-data {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
              font-size: 14px;
              margin-bottom: 20px;
            }

            .header-item {
              width: 45%;
              margin-bottom: 5px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              page-break-inside: auto;
            }

            thead {
              display: table-header-group;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            th, td {
              padding: 6px;
              text-align: center;
              font-size: 13px;
            }

            th {
              font-weight: bold;
            }
          }
        </style>
      </head>

      <body>
        <div class="print-header">
          <div class="report-title">${title}</div>
          <div class="header-data">
            ${headerHtml}
          </div>
        </div>

        <table>
          <thead>
            <tr>${tableHeader}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
}
