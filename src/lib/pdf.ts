export async function exportElementToPdf(el: HTMLElement, filename: string) {
  if (!el) throw new Error("PDF: element ref is null");

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const title = cleanFilename.replace(/\.pdf$/i, "");

  if ((document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch {}
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.setAttribute("aria-hidden", "true");

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("PDF: could not create print document.");
  }

  const cloned = el.cloneNode(true) as HTMLElement;

  doc.open();
  doc.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            direction: rtl;
            background: #ffffff;
            color: #111827;
            font-family: "Noto Naskh Arabic", "Amiri", "Segoe UI", serif;
          }

          body {
            padding: 0;
          }

          @page {
            size: A4;
            margin: 12mm;
          }

          .pdf-page {
            width: 100%;
            direction: rtl;
            background: #ffffff;
            color: #111827;
          }

          .pdf-cover {
            background:
              radial-gradient(circle at 15% 0%, rgba(96, 165, 250, 0.30), transparent 34%),
              radial-gradient(circle at 85% 10%, rgba(250, 204, 21, 0.25), transparent 30%),
              linear-gradient(135deg, #0f172a 0%, #111827 48%, #1e293b 100%);
            color: #f8fafc;
            border-radius: 22px;
            padding: 26px 26px 24px;
            margin: 0 0 18px;
            border: 1px solid #334155;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .pdf-card {
            background: #ffffff;
            color: #111827;
            border: 1px solid #dbe3ef;
            border-radius: 18px;
            padding: 18px;
            margin-bottom: 14px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .pdf-section-card {
            background: #f8fafc;
            color: #111827;
            border: 1px solid #dbe3ef;
            border-radius: 20px;
            padding: 18px;
            margin-bottom: 16px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .pdf-question-card {
            background: #ffffff;
            border: 1px solid #dbe3ef;
            border-radius: 16px;
            padding: 16px;
            margin: 0 0 12px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .gold-text {
            color: #d97706;
          }

          .electric-text {
            color: #2563eb;
          }

          .muted {
            color: #64748b;
          }

          .success {
            color: #15803d;
          }

          .destructive {
            color: #dc2626;
          }

          .pdf-title {
            font-size: 32px;
            line-height: 1.35;
            font-weight: 800;
            margin: 8px 0 4px;
          }

          .pdf-subtitle {
            font-size: 14px;
            color: #cbd5e1;
            margin-bottom: 18px;
          }

          .field-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 16px;
          }

          .field {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 14px;
            padding: 10px 12px;
          }

          .field-light {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 10px 12px;
          }

          .score-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 14px;
          }

          .score-card {
            background: #f8fafc;
            border: 1px solid #dbe3ef;
            border-radius: 18px;
            padding: 16px;
            text-align: center;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .final-score {
            background:
              radial-gradient(circle at 20% 0%, rgba(250, 204, 21, 0.18), transparent 32%),
              linear-gradient(135deg, #fff7ed, #eff6ff);
            border: 1px solid #facc15;
            border-radius: 20px;
            padding: 18px;
            text-align: center;
            margin-bottom: 18px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .progress-track {
            height: 8px;
            border-radius: 999px;
            background: #e2e8f0;
            overflow: hidden;
            margin-top: 10px;
          }

          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #2563eb, #f59e0b);
          }

          .section-title {
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            margin: 0 0 14px;
            padding-bottom: 8px;
            border-bottom: 2px solid #dbeafe;
          }

          .question-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 10px;
          }

          .question-title {
            font-size: 17px;
            font-weight: 800;
            line-height: 1.9;
            flex: 1;
            margin: 0;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 11px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 800;
            background: #e2e8f0;
            color: #334155;
            white-space: nowrap;
          }

          .badge-success {
            background: #dcfce7;
            color: #15803d;
          }

          .badge-wrong {
            background: #fee2e2;
            color: #dc2626;
          }

          .badge-partial {
            background: #fef3c7;
            color: #b45309;
          }

          .context-box {
            background: #f8fafc;
            border-right: 4px solid #f59e0b;
            border-radius: 12px;
            padding: 10px 12px;
            margin: 10px 0;
            line-height: 1.9;
            color: #334155;
          }

          .answer-line {
            border: 1px solid #dbe3ef;
            background: #f8fafc;
            border-radius: 14px;
            padding: 12px;
            margin-top: 9px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .answer-line.ok {
            border-color: #86efac;
            background: #f0fdf4;
          }

          .answer-line.wrong {
            border-color: #fecaca;
            background: #fff5f5;
          }

          .answer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .answer-label {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 3px;
          }

          .answer-value {
            font-weight: 800;
            line-height: 1.8;
            word-break: break-word;
          }

          .footer-note {
            text-align: center;
            color: #64748b;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
          }

          h1, h2, h3, p {
            margin-top: 0;
          }

          @media print {
            html,
            body {
              background: #ffffff !important;
            }

            .pdf-page {
              padding: 0 !important;
            }

            .pdf-card,
            .pdf-section-card,
            .pdf-question-card,
            .score-card,
            .final-score {
              box-shadow: none !important;
            }

            .avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
    </html>
  `);
  doc.close();

  doc.getElementById("print-root")?.appendChild(cloned);

  // Try to make the default Save-as-PDF filename match our generated name.
  doc.title = title;

  const previousTitle = document.title;

// Force Chrome/Edge Save as PDF default filename
  document.title = title;

  try {
    iframe.contentWindow!.document.title = title;
  } catch {}

  await new Promise((resolve) => setTimeout(resolve, 500));

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  setTimeout(() => {
    document.title = previousTitle;
    document.body.removeChild(iframe);
  }, 1500);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}