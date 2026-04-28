import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Render a PDF-safe HTML element to a paginated PDF.
 * To avoid html2canvas choking on oklch/oklab/color-mix from the surrounding
 * theme, we clone the element into an isolated container appended directly
 * to <body>, with a hard-reset wrapper that disables theme variables.
 */
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  if (!el) throw new Error("PDF: element ref is null");

  if ((document as any).fonts?.ready) {
    try { await (document as any).fonts.ready; } catch {}
  }

  // Build isolated container at body root so it inherits NOTHING from app theme.
  const isolate = document.createElement("div");
  isolate.setAttribute("dir", "rtl");
  isolate.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "width:794px",
    "background:#ffffff",
    "color:#111827",
    "z-index:-1",
    "opacity:0",
    "pointer-events:none",
    'font-family:"Noto Naskh Arabic","Amiri","Segoe UI",sans-serif',
    // disable inheritance of any oklch/oklab CSS vars that would crash html2canvas
    "--background:#ffffff",
    "--foreground:#111827",
    "--border:#e5e7eb",
  ].join(";");

  const clone = el.cloneNode(true) as HTMLElement;
  // strip any class names that could pull in themed CSS variables
  clone.querySelectorAll<HTMLElement>("*").forEach((n) => {
    n.removeAttribute("class");
  });
  clone.removeAttribute("class");

  isolate.appendChild(clone);
  document.body.appendChild(isolate);

  await new Promise((r) => requestAnimationFrame(() => r(null)));

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(isolate, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: isolate.scrollWidth,
      windowHeight: isolate.scrollHeight,
    });
  } finally {
    document.body.removeChild(isolate);
  }

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = canvas.width / pageWidth;
  const pageHeightPx = pageHeight * ratio;

  let renderedPx = 0;
  let pageIndex = 0;
  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeightPx;
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
    const sliceData = slice.toDataURL("image/jpeg", 0.92);
    if (pageIndex > 0) pdf.addPage();
    const sliceHeightMm = sliceHeightPx / ratio;
    pdf.addImage(sliceData, "JPEG", 0, 0, pageWidth, sliceHeightMm);
    renderedPx += sliceHeightPx;
    pageIndex += 1;
  }

  pdf.save(filename);
}
