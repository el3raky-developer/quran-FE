
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import ArabicReshaper from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";

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



interface Student {
  student: {
    name: string;
    gender?: string;
    national_ID?: string;
  };
  grade: number;
  passed: boolean;
  place?: number;
  levelNumber: number;
  // track number of parts for the level so we can choose correct template
  levelValue?: number;
  rank?: number;
}

function detectGenderFromNID(nid?: string): "male" | "female" {
  // Egyptian NID is 14 digits; the 13th digit indicates gender
  // (odd = male, even = female). The final digit is a checksum.
  if (!nid) {
    return "male";
  }
  const trimmed = nid.trim();
  // use second-to-last digit if available
  const idx = trimmed.length - 2;
  if (idx >= 0) {
    const genChar = trimmed.charAt(idx);
    const num = Number(genChar);
    if (!isNaN(num)) {
      return num % 2 === 0 ? "female" : "male";
    }
  }
  // fallback: try last digit as before
  const last = trimmed.slice(-1);
  const numLast = Number(last);
  if (!isNaN(numLast)) {
    return numLast % 2 === 0 ? "female" : "male";
  }
  return "male";
}

function getCertificateTemplate(student: Student) {
  // determine gender using provided value or infer from national ID
  let gender = student.student.gender;
  if (!gender) {
    gender = detectGenderFromNID(student.student.national_ID);
    // save back so future references have the computed value
    student.student.gender = gender;
  }

  const over10 = (student.levelValue ?? 0) > 10;

  // top students
  if (student.place) {
    if (over10) {
      return gender === "male"
        ? "/certificates/top-male-over-10-parts.jpg"
        : "/certificates/top-female-over-10-parts.jpg";
    } else {
      return gender === "male"
        ? "/certificates/top-male-under-10-parts.jpg"
        : "/certificates/top-female-under-10-parts.jpg";
    }
  }

  // failed students
  if (!student.passed) {
    return gender === "male"
      ? "/certificates/failed-male.jpg"
      : "/certificates/failed-female.jpg";
  }

  // normal passed students
  if (over10) {
    return gender === "male"
      ? "/certificates/success-male-over-10-parts.jpg"
      : "/certificates/success-female-over-10-parts.jpg";
  } else {
    return gender === "male"
      ? "/certificates/success-male-under-10-parts.jpg"
      : "/certificates/success-female-under-10-parts.jpg";
  }
}

export async function generateCertificates(
  students: Student[],
  _competitionTitle: string,
  filename?: string
) {



  const finalPdf = await PDFDocument.create();
  const fontBytes = await fetch("/fonts/Amiri-Bold.ttf")
    .then(res => res.arrayBuffer());

  finalPdf.registerFontkit(fontkit);

  const arabicFont = await finalPdf.embedFont(fontBytes);

  for (const student of students) {


    const templatePath = getCertificateTemplate(student);
    const bytes = await fetch(templatePath).then((res) => res.arrayBuffer());

    let page;
    let width: number;
    let height: number;

    if (templatePath.endsWith(".pdf")) {
      const templatePdf = await PDFDocument.load(bytes);
      [page] = await finalPdf.copyPages(templatePdf, [0]);
      const size = page.getSize();
      width = size.width;
      height = size.height;
      // page not yet added to finalPdf; will add after drawing
    } else {
      // assume image (jpg/png)
      let img;
      if (templatePath.match(/\.jpe?g$/i)) {
        img = await finalPdf.embedJpg(bytes);
      } else {
        img = await finalPdf.embedPng(bytes);
      }
      const dims = img.scale(1);
      width = dims.width;
      height = dims.height;
      page = finalPdf.addPage([width, height]); // create and add once
      page.drawImage(img, { x: 0, y: 0, width, height });
    }

    const name = fixArabicText(student.student.name)
    const textWidth = arabicFont.widthOfTextAtSize(name, 130);

    // student name
    page.drawText(name, {
      x: (width - textWidth) / 2,
      y: height / 2 - 90,
      size: 130,
      font: arabicFont,
      color: rgb(0, 0, 1)
    });


    if (student.grade > 50) {

      // rank if exists
      if (student.place) {

        const placeText = placeMap[student.place]

        page.drawText(fixArabicText(placeText), {
          x: width / 2 - 270,
          y: height / 2 - 420,
          size: 130,
          font: arabicFont,
          color: rgb(0, 0, 1)
        });

      }

      page.drawText(`${student.levelValue == 31 ? 30 : student.levelValue}`, {
        x: student.place ? width / 2 - 1000 : width / 2 - 650,
        y: height / 2 - 420,
        size: 130,
        font: arabicFont,
        color: rgb(0, 0, 1)
      });

      // grade
      page.drawText(` ${student.grade}`, {
        x: student.place ? width / 2 + 600 : width / 2 + 250,
        y: height / 2 - 420,
        size: 130,
        font: arabicFont,
        color: rgb(0, 0, 1)
      });
    }

    // for PDF templates, page was not added earlier, so add now
    if (!templatePath.endsWith(".pdf")) {
      // already added when created
    } else {
      finalPdf.addPage(page);
    }
  }

  const pdfBytes = await finalPdf.save();

  // pdfBytes may be Uint8Array; cast to any to satisfy TS
  const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  if (filename) {
    // trigger download with specified filename
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // leave the url open in new tab as well
    window.open(url);
  } else {
    window.open(url);
  }
}


export async function printCertificates(
  students: Student[],
  _competitionTitle: string,
  filename?: string
) {
  await generateCertificates(students, _competitionTitle, filename);
}

const placeMap: Record<number, string> = {
  1: "الأول",
  2: "الثاني",
  3: "الثالث",
  4: "الرابع",
  5: "الخامس",
  6: "السادس",
  7: "السابع",
  8: "الثامن",
  9: "التاسع",
  10: "العاشر"
};


function fixArabicText(text: string) {


  text = text.trim();

  // ArabicReshaper will apply proper cursive joining and form selection
  const reshaped = ArabicReshaper.ArabicShaper.convertArabic(text);

  // bidi-js will reorder the string for correct display in a PDF context
  const bidi = bidiFactory();
  const levels = bidi.getEmbeddingLevels(reshaped);

  // PDF-lib doesn't support RTL direction, so reverse the final string
  // to emulate right-to-left rendering during drawText.
  let reordered = bidi.getReorderedString(reshaped, levels);
  return reordered.split("").reverse().join("");
}