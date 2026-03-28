// utils/pdfGenerator.ts
"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export async function generatePDF(
  element: HTMLElement,
  filename: string = "invoice.pdf",
  options: {
    scale?: number;
    format?: "a4" | "letter" | string;
    orientation?: "portrait" | "landscape";
    margin?: number;
  } = {}
): Promise<void> {
  try {
    const {
      scale = 2,
      format = "a4",
      orientation = "portrait",
      margin = 10, // default margin
    } = options;

    // Wait a bit for dynamic content/fonts
    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      ignoreElements: (el) =>
        el.hasAttribute("data-html2canvas-ignore") ||
        el.classList.contains("no-print"),
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      unit: "mm",
      format,
      orientation,
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const pdfHeight = pdf.internal.pageSize.getHeight() - margin * 2;

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    while (heightLeft > 0) {
      const drawHeight = Math.min(heightLeft, pdfHeight);

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        margin,
        imgWidth,
        drawHeight,
        undefined,
        "FAST"
      );

      heightLeft -= pdfHeight;
      if (heightLeft > 0) {
        pdf.addPage();
        position = 0;
      }
    }

    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Failed to generate PDF. Please try again.");
  }
}