import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Render an HTML element to a multi-page A4 PDF.
 * Uses html2canvas to preserve Arabic shaping done by the browser.
 */
export async function exportElementToPdf(el: HTMLElement, filename: string): Promise<void> {
  if (!el) throw new Error("PDF export: element is null");
  if (typeof window === "undefined") throw new Error("PDF export: window unavailable");

  // Wait one frame to ensure layout is finalized
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, {
      backgroundColor: "#0f1226",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });
  } catch (e) {
    console.error("[pdf] html2canvas failed:", e);
    throw e;
  }

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Slice the canvas vertically into A4-page-height chunks to avoid
  // huge images that cause some browsers to silently fail the download.
  const pxPerMm = canvas.width / pageWidth;
  const pageHeightPx = Math.floor(pageHeight * pxPerMm);
  let renderedHeight = 0;
  let pageIndex = 0;

  while (renderedHeight < canvas.height) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeight;
    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) throw new Error("PDF export: 2D context unavailable");
    ctx.fillStyle = "#0f1226";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      renderedHeight,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );
    const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);
    const sliceMm = sliceHeight / pxPerMm;
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, sliceMm);
    renderedHeight += sliceHeight;
    pageIndex += 1;
  }

  // Trigger download via blob to maximize cross-browser compatibility
  try {
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error("[pdf] download trigger failed, falling back to pdf.save():", e);
    pdf.save(filename);
  }
}
