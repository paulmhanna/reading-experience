import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function findUnsupportedPdfStyles(root: HTMLElement) {
  const bad: Array<{
    element: Element;
    tag: string;
    className: string;
    prop: string;
    value: string;
    text: string;
  }> = [];

  const elements = [root, ...Array.from(root.querySelectorAll("*"))];

  elements.forEach((el) => {
    const s = window.getComputedStyle(el);
    const checks = {
      color: s.color,
      backgroundColor: s.backgroundColor,
      borderColor: s.borderColor,
      borderTopColor: s.borderTopColor,
      borderRightColor: s.borderRightColor,
      borderBottomColor: s.borderBottomColor,
      borderLeftColor: s.borderLeftColor,
      boxShadow: s.boxShadow,
      textDecorationColor: s.textDecorationColor,
      outlineColor: s.outlineColor,
    };

    Object.entries(checks).forEach(([prop, value]) => {
      if (
        value &&
        (value.includes("oklch") ||
          value.includes("oklab") ||
          value.includes("color-mix"))
      ) {
        bad.push({
          element: el,
          tag: el.tagName,
          className: el.className,
          prop,
          value,
          text: el.textContent?.slice(0, 80) || "",
        });
      }
    });
  });

  console.table(bad);
  return bad;
}

function findUnsupportedPdfCssRules() {
  const badRules: Array<{
    href: string;
    selector: string;
    cssText: string;
  }> = [];

  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach((rule) => {
        const cssText = rule.cssText || "";
        if (
          cssText.includes("oklch") ||
          cssText.includes("oklab") ||
          cssText.includes("color-mix")
        ) {
          badRules.push({
            href: (sheet as CSSStyleSheet).href || "inline <style>",
            selector: "selectorText" in rule ? (rule as CSSStyleRule).selectorText || "<rule>" : "<rule>",
            cssText: cssText.slice(0, 300),
          });
        }
      });
    } catch (error) {
      badRules.push({
        href: (sheet as CSSStyleSheet).href || "unknown stylesheet",
        selector: "<unreadable>",
        cssText: `Could not inspect stylesheet: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  });

  console.table(badRules);
  return badRules;
}

function sanitizePdfTree(root: HTMLElement) {
  const resetStyles = [
    "color:#111827",
    "background:#ffffff",
    "background-color:#ffffff",
    "border-color:#e5e7eb",
    "box-shadow:none",
    "text-shadow:none",
    "text-decoration-color:#111827",
    "outline-color:#111827",
    "filter:none",
    "backdrop-filter:none",
  ].join(";");

  [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))].forEach((node) => {
    node.removeAttribute("class");
    const currentStyle = node.getAttribute("style");
    node.setAttribute("style", currentStyle ? `${currentStyle};${resetStyles}` : resetStyles);
  });
}

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

  const initialBadStyles = findUnsupportedPdfStyles(el);
  const stylesheetBadRules = findUnsupportedPdfCssRules();
  if (initialBadStyles.length > 0) {
    console.warn(
      "[pdf] Original report has inherited unsafe styles; continuing with sanitized clone.",
      initialBadStyles,
    );
  }

  // Build isolated container at body root so it inherits NOTHING from app theme.
  const isolate = document.createElement("div");
  isolate.setAttribute("dir", "rtl");
  isolate.style.cssText = [
    "position:absolute",
    "left:-9999px",
    "top:0",
    "width:794px",
    "min-height:1123px",
    "background:#ffffff",
    "background-color:#ffffff",
    "color:#111827",
    "z-index:999999",
    "opacity:1",
    "visibility:visible",
    "display:block",
    "overflow:visible",
    "pointer-events:none",
    "margin:0",
    "padding:0",
    "box-shadow:none",
    "filter:none",
    "backdrop-filter:none",
    "isolation:isolate",
    "direction:rtl",
    'font-family:"Noto Naskh Arabic","Amiri","Segoe UI",sans-serif',
    // disable inheritance of any oklch/oklab CSS vars that would crash html2canvas
    "--background:#ffffff",
    "--foreground:#111827",
    "--border:#e5e7eb",
    "--color-background:#ffffff",
    "--color-foreground:#111827",
    "--color-border:#e5e7eb",
  ].join(";");

  const clone = el.cloneNode(true) as HTMLElement;
  sanitizePdfTree(clone);

  isolate.appendChild(clone);
  document.body.appendChild(isolate);

  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 100));

  console.log("PDF isolate size:", isolate.scrollWidth, isolate.scrollHeight);
  console.log("PDF clone text length:", clone.innerText.length);

  if (isolate.scrollHeight === 0 || clone.innerText.length === 0) {
    document.body.removeChild(isolate);
    throw new Error("PDF generation failed: Isolated element or clone content is empty.");
  }

  const isolatedBadStyles = findUnsupportedPdfStyles(clone);
  if (isolatedBadStyles.length > 0) {
    document.body.removeChild(isolate);
    throw new Error("PDF unsafe styles found. Check console table.");
  }

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(isolate, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
          node.parentNode?.removeChild(node);
        });

        const hardReset = clonedDoc.createElement("style");
        hardReset.textContent = `
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #111827 !important;
          }
          *, *::before, *::after {
            box-shadow: none !important;
            text-shadow: none !important;
            filter: none !important;
            backdrop-filter: none !important;
          }
        `;
        clonedDoc.head.appendChild(hardReset);
      },
      windowWidth: isolate.scrollWidth,
      windowHeight: isolate.scrollHeight,
    });
  } finally {
    document.body.removeChild(isolate);
  }

  if (stylesheetBadRules.length > 0) {
    console.info("[pdf] stripped stylesheet rules containing unsupported color functions before capture");
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
