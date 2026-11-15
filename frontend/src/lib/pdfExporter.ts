import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export interface PdfExportOptions {
  filename?: string;
  scale?: number;
}

/**
 * Capture an on-screen HTML element and export it directly as a crisp,
 * high-resolution A4 PDF document matching the browser print view 1:1.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string = "document.pdf",
  options: PdfExportOptions = {}
): Promise<void> {
  const scale = options.scale ?? 2.5;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.98);

  // A4 Page dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight <= pdfHeight) {
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
  } else {
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;
    }
  }

  pdf.save(filename);
}
