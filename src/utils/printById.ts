
export interface PrintColumn {
    title: string;
    key: string;
}

export interface PrintOptions {
    title?: string;
    direction?: 'rtl' | 'ltr';
    styles?: string; // Custom CSS

    // Header Configuration
    headerHtml?: string; // Custom HTML header
    headerData?: Record<string, string>; // Key-value pairs for structured header

    // Data Table Configuration (if printing data instead of DOM element)
    columns?: PrintColumn[];
    rows?: Record<string, any>[];

    footerHtml?: string;
}

// export function printById(elementIdOrData: string | { columns: PrintColumn[], rows: any[] }, options: PrintOptions = {}) {
//     const {
//         title = 'Print',
//         direction = 'rtl',
//         styles = '',
//         headerHtml = '',
//         headerData = {},
//         footerHtml = ''
//     } = options;

//     let contentHtml = '';

//     // Check if first argument is ID string or Data object
//     if (typeof elementIdOrData === 'string') {
//         const element = document.getElementById(elementIdOrData);
//         if (!element) {
//             console.error(`Element with id '${elementIdOrData}' not found`);
//             return;
//         }
//         contentHtml = element.innerHTML;
//     } else {
//         // Generate Table from Data
//         const { columns, rows } = elementIdOrData;
//         if (!columns || !rows) {
//             console.error('Columns and rows are required for data printing');
//             return;
//         }

//         const tableHeader = columns.map(col => `<th>${col.title}</th>`).join("");
//         const tableRows = rows.map(row => `
//             <tr>
//                 ${columns.map(col => `<td>${row[col.key] ?? ""}</td>`).join("")}
//             </tr>
//         `).join("");

//         contentHtml = `
//             <table>
//                 <thead><tr>${tableHeader}</tr></thead>
//                 <tbody>${tableRows}</tbody>
//             </table>
//         `;
//     }

//     // Generate Header Data HTML if provided
//     let headerDataHtml = '';
//     if (Object.keys(headerData).length > 0) {
//         headerDataHtml = `
//             <div class="print-header-data">
//                 ${Object.entries(headerData).map(([key, value]) => `
//                     <div class="header-item"><strong>${key}:</strong> ${value}</div>
//                 `).join('')}
//             </div>
//         `;
//     }

//     const printWindow = window.open('', '', 'width=1000,height=700');
//     if (!printWindow) {
//         console.error('Failed to open print window');
//         return;
//     }

//     const baseStyles = `
//         @media print {
//             body { 
//                 font-family: "Times New Roman", Arial, sans-serif; 
//                 direction: ${direction}; 
//                 padding: 20px; 
//                 margin: 0; 
//             }
//             .print-container { width: 100%; }

//             /* Header Styling */
//             .print-header-title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
//             .print-header-data { display: flex; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
//             .header-item { width: 33%; font-size: 14px; margin-bottom: 8px; }

//             /* Table Styling */
//             table { width: 100%; border-collapse: collapse; margin-top: 10px; }
//             th, td { border: 1px solid #ddd; padding: 8px; text-align: ${direction === 'rtl' ? 'center' : 'left'}; font-size: 12px; }
//             th { background-color: #f8f9fa; font-weight: bold; -webkit-print-color-adjust: exact; }
//             tr:nth-child(even) { background-color: #f9f9f9; }

//             /* Custom Styles */
//             ${styles}
//         }
//         /* Preview Styles */
//         body { font-family: Arial, sans-serif; margin: 20px; }
//         .print-header-data { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
//         .header-item { background: #f5f5f5; padding: 5px 10px; border-radius: 4px; }
//         table { width: 100%; border-collapse: collapse; }
//         th, td { border: 1px solid #ddd; padding: 8px; }
//     `;

//     printWindow.document.write(`
//        <!DOCTYPE html>
// <html lang="${direction === 'rtl' ? 'ar' : 'en'}" 
//       dir="${direction}" 
//       translate="no">
// <head>
//     <meta charset="UTF-8">
//     <meta name="google" content="notranslate">
//     <meta http-equiv="Content-Language" content="${direction === 'rtl' ? 'ar' : 'en'}">
//     <title>${title}</title>
//     <style>${baseStyles}</style>
// </head>
//         <body>
//             <div class="print-container">
//                 <div class="print-header-title">${title}</div>
//                 ${headerHtml}
//                 ${headerDataHtml}

//                 <div class="print-content">
//                     ${contentHtml}
//                 </div>

//                 ${footerHtml ? `<div class="print-footer">${footerHtml}</div>` : ''}
//             </div>
//             <script>
//                 window.onload = function() {
//                     setTimeout(() => { window.print(); window.close(); }, 500);
//                 };
//             </script>
//         </body>
//         </html>
//     `);
//     printWindow.document.close();
// }


// export function printData(
//     data: { columns: { title: string; key: string }[]; rows: any[] },
//     options: {
//         title?: string;
//         headerData?: Record<string, string>;
//         styles?: string;
//     } = {}
// ) {
//     const printRoot = document.getElementById("print-root")
//     if (!printRoot) return

//     const { columns, rows } = data
//     const { title = "Print", headerData = {}, styles = "" } = options

//     const headerHtml = Object.entries(headerData)
//         .map(([key, value]) => `
//       <div style="margin-bottom:5px">
//         <strong>${key}:</strong> ${value}
//       </div>
//     `)
//         .join("")

//     const tableHeader = columns.map(col => `<th>${col.title}</th>`).join("")
//     const tableRows = rows.map(row => `
//     <tr>
//       ${columns.map(col => `<td>${row[col.key] ?? ""}</td>`).join("")}
//     </tr>
//   `).join("")

//     printRoot.innerHTML = `
//     <div>
//       <h2 style="text-align:center; margin-bottom:20px">${title}</h2>
//       ${headerHtml}
//       <table style="width:100%; border-collapse: collapse;">
//         <thead>
//           <tr>${tableHeader}</tr>
//         </thead>
//         <tbody>
//           ${tableRows}
//         </tbody>
//       </table>
//     </div>
//     <style>
//       table, th, td { border: 1px solid #ccc; }
//       th, td { padding: 8px; }
//       ${styles}
//     </style>
//   `

//     printRoot.style.display = "block"

//     setTimeout(() => {
//         window.print()
//         printRoot.style.display = "none"
//         printRoot.innerHTML = ""
//     }, 100)
// }

export function printData(
  data: {
    columns: { title: string; key: string , width?: string }[];
    rows?: any[];
    leftRows?: any[];
    rightRows?: any[];
  },
  options: {
    title?: string;
    headerData?: Record<string, string>;
    styles?: string;
    twoTables?: boolean;
  } = {}
) {
  const printRoot = document.getElementById("print-root");
  if (!printRoot) return;

  const { columns, rows, leftRows = [], rightRows = [] } = data;
  const {
    title = "Print",
    headerData = {},
    styles = "",
    twoTables = false,
  } = options;

  const headerHtml = Object.entries(headerData)
    .map(
      ([key, value]) => `
      <div style="margin-bottom:5px">
        <strong>${key}:</strong> ${value}
      </div>
    `
    )
    .join("");

    const tableHeader = columns
    .map(
      col =>
        `<th style="${col.width ? `width:${col.width};` : ''}">
          ${col.title}
        </th>`
    )
    .join("");

  const buildTable = (tableRowsData: any[]) => {
    const tableRows = tableRowsData
      .map(
        row => `
        <tr>
        ${columns
          .map(
            col =>
              `<td style="${col.width ? `width:${col.width};` : ''}">
                ${row[col.key] ?? ""}
              </td>`
          )
          .join("")}
        </tr>
      `
      )
      .join("");

    return `
      <table style="width:100%;  border-collapse: collapse;">
        <thead><tr>${tableHeader}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
  };

  // ⭐ layout logic
  const tablesHtml = twoTables
    ? `
      <div style="display:flex; gap:10px;">
        <div style="flex:1;">${buildTable(leftRows)}</div>
        <div style="flex:1;">${buildTable(rightRows)}</div>
      </div>
    `
    : buildTable(rows || []);

  printRoot.innerHTML = `
    <div>
      <h2 style="text-align:center; margin-bottom:20px">${title}</h2>
      ${headerHtml}
      ${tablesHtml}
    </div>
    <style>
      @media print {
        @page { size: A4 portrait; margin: 10mm 1mm; }
      }
      table, th, td { border: 1px solid #ccc; }
      th { background-color: #f3f3f3; font-weight: bold; }
      th, td { padding: 3px; text-align: right; }
      td:first-child { text-align: center; }
      td, th {
        word-break: break-word;
        white-space: normal;
      }
      ${styles}
    </style>
  `;

  printRoot.style.display = "block";

  setTimeout(() => {
    window.print();
    printRoot.style.display = "none";
    printRoot.innerHTML = "";
  }, 100);
}