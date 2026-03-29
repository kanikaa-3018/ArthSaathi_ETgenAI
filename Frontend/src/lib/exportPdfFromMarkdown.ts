/**
 * PR #13 pipeline: same Markdown as `.md` export → GFM HTML → Notion-style “paper” (light theme,
 * Inter, padded A4 column) → html2canvas → multi-page jsPDF. Produces crisp, readable PDFs (not a
 * screenshot of the dark app UI).
 */
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { marked } from "marked";

/** YAML frontmatter is for `.md` only; strip before rendering HTML for PDF. */
export function stripYamlFrontmatter(md: string): string {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
}

const A4_WIDTH_PX = 794;
const PAD_X_PX = 72;
const PAD_TOP_PX = 76;
const PAD_BOTTOM_PX = 88;

const INTER_FONT_ID = "arthsaathi-pdf-inter-font";

async function ensureInterLoaded(): Promise<void> {
  if (!document.getElementById(INTER_FONT_ID)) {
    const link = document.createElement("link");
    link.id = INTER_FONT_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    await new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
    });
  }
  try {
    await document.fonts.load("15px Inter");
  } catch {
    /* fallbacks */
  }
}

const PDF_DOCUMENT_CSS = `
.pdf-export-root,
.pdf-export-root *,
.pdf-export-root *::before,
.pdf-export-root *::after { box-sizing: border-box; }
.pdf-export-root {
  width: ${A4_WIDTH_PX}px;
  margin: 0;
  padding: ${PAD_TOP_PX}px ${PAD_X_PX}px ${PAD_BOTTOM_PX}px;
  background: #ffffff;
  color: #37352f;
  -webkit-font-smoothing: antialiased;
}
article.pdf-doc {
  font-family: "Inter", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.625;
  color: #37352f;
  background: transparent;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
}
article.pdf-doc h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #111111;
  margin: 0 0 18px;
  line-height: 1.2;
}
article.pdf-doc h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111111;
  margin: 32px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(55, 53, 47, 0.13);
}
article.pdf-doc h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 22px 0 8px;
  color: #1f1f1f;
}
article.pdf-doc h4 {
  font-size: 15px;
  font-weight: 600;
  margin: 16px 0 6px;
  color: #2b2b2b;
}
article.pdf-doc p { margin: 0 0 10px; }
article.pdf-doc ul, article.pdf-doc ol { margin: 0 0 14px; padding-left: 24px; }
article.pdf-doc li { margin: 0 0 5px; }
article.pdf-doc li > p { margin: 0 0 5px; }
article.pdf-doc blockquote {
  margin: 14px 0;
  padding: 0 0 0 14px;
  border-left: 3px solid rgba(55, 53, 47, 0.17);
  color: #5f5f5f;
}
article.pdf-doc hr {
  border: none;
  border-top: 1px solid rgba(55, 53, 47, 0.12);
  margin: 22px 0;
}
article.pdf-doc table {
  border-collapse: collapse;
  width: 100%;
  margin: 14px 0 18px;
  font-size: 12px;
  line-height: 1.45;
  table-layout: fixed;
}
article.pdf-doc th, article.pdf-doc td {
  border: 1px solid rgba(55, 53, 47, 0.12);
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
article.pdf-doc th {
  background: #f7f6f3;
  font-weight: 600;
  color: #1a1a1a;
}
article.pdf-doc code {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.88em;
  background: rgba(55, 53, 47, 0.06);
  padding: 1px 5px;
  border-radius: 3px;
}
article.pdf-doc pre {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  background: #f5f5f4;
  padding: 12px 14px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 12px 0;
}
article.pdf-doc pre code { background: none; padding: 0; font-size: inherit; }
article.pdf-doc a { color: #0b6bcb; text-decoration: none; }
article.pdf-doc strong { font-weight: 600; }
article.pdf-doc em { font-style: italic; }
`;

marked.setOptions({ gfm: true });

async function markdownBodyToHtmlFragment(mdBody: string): Promise<string> {
  const html = await marked.parse(mdBody);
  return String(html);
}

function mountPrintableDom(htmlFragment: string): { host: HTMLDivElement; captureEl: HTMLElement } {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-14000px",
    "top:0",
    `width:${A4_WIDTH_PX}px`,
    "overflow:visible",
    "pointer-events:none",
  ].join(";");

  const style = document.createElement("style");
  style.textContent = PDF_DOCUMENT_CSS;

  const root = document.createElement("div");
  root.className = "pdf-export-root";

  const article = document.createElement("article");
  article.className = "pdf-doc";
  article.innerHTML = htmlFragment;

  root.appendChild(article);
  host.appendChild(style);
  host.appendChild(root);
  document.body.appendChild(host);
  return { host, captureEl: root };
}

function addCanvasToPdfPages(canvas: HTMLCanvasElement, pdf: jsPDF): void {
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const pageHeightPx = (canvas.width * pdfH) / pdfW;
  let y = 0;
  let page = 0;
  while (y < canvas.height) {
    if (page > 0) pdf.addPage();
    const sliceH = Math.min(pageHeightPx, canvas.height - y);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D context for PDF slice");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    const dataUrl = slice.toDataURL("image/jpeg", 0.93);
    const sliceMmH = (sliceH * pdfW) / canvas.width;
    pdf.addImage(dataUrl, "JPEG", 0, 0, pdfW, sliceMmH);
    y += sliceH;
    page++;
  }
}

/** Markdown string → printable PDF download (same content as `.md`, styled for paper). */
export async function downloadPdfFromMarkdown(markdown: string, fileStem: string): Promise<void> {
  const body = stripYamlFrontmatter(markdown);
  const fragment = await markdownBodyToHtmlFragment(body);
  const { host, captureEl } = mountPrintableDom(fragment);

  try {
    await ensureInterLoaded();
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    const canvas = await html2canvas(captureEl, {
      scale: 2.25,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: A4_WIDTH_PX,
      x: 0,
      y: 0,
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    addCanvasToPdfPages(canvas, pdf);
    const safe = fileStem.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "report";
    const date = new Date().toISOString().slice(0, 10);
    pdf.save(`ArthSaathi_${safe}_${date}.pdf`);
  } finally {
    host.remove();
  }
}
