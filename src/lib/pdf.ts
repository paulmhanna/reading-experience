import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Render an HTML element to a paginated PDF.
 * Throws on failure so callers can show error UI.
 */
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  if (!el) throw new Error("PDF: element ref is null");

  // Wait for fonts so Arabic glyphs render correctly
  if ((document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch {}
  }
  // small frame so layout settles
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  const canvas = await html2canvas(el, {
    backgroundColor: "#0f1226",
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Width fits page; compute slice height in canvas px for one page
  const ratio = canvas.width / pageWidth;
  const pageHeightPx = pageHeight * ratio;

  let renderedPx = 0;
  let pageIndex = 0;
  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);

    // Draw slice into a temp canvas
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeightPx;
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#0f1226";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(
      canvas,
      0, renderedPx, canvas.width, sliceHeightPx,
      0, 0, canvas.width, sliceHeightPx
    );
    const sliceData = slice.toDataURL("image/jpeg", 0.92);

    if (pageIndex > 0) pdf.addPage();
    const sliceHeightMm = sliceHeightPx / ratio;
    pdf.addImage(sliceData, "JPEG", 0, 0, pageWidth, sliceHeightMm);

    renderedPx += sliceHeightPx;
    pageIndex += 1;
  }

  pdf.save(filename);
}
