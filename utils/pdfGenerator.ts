import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const generatePDF = async (
  element: HTMLElement,
  fileName: string = "invoice.pdf"
) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,

    onclone: (doc) => {
      const elements = doc.querySelectorAll("*");

      elements.forEach((el) => {
        if (el instanceof HTMLElement) {
          const computed = window.getComputedStyle(el);

          // ✅ Replace unsupported colors with safe ones
          if (computed.color.includes("oklch") || computed.color.includes("lab")) {
            el.style.color = "#000";
          }

          if (
            computed.backgroundColor.includes("oklch") ||
            computed.backgroundColor.includes("lab")
          ) {
            el.style.backgroundColor = "#fff";
          }

          if (
            computed.borderColor.includes("oklch") ||
            computed.borderColor.includes("lab")
          ) {
            el.style.borderColor = "#000";
          }

          // Optional cleanup
          el.style.boxShadow = "none";
        }
      });
    },
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

  pdf.save(fileName);
};