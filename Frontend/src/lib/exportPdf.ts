import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/** Multi-page PDF from report DOM — FEATURES_BUILD_SPEC.md §F6 */
export async function exportReportPdf(element: HTMLElement, investorName: string): Promise<void> {
  const collapsed = element.querySelectorAll('[data-state="closed"]');
  collapsed.forEach((el) => el.setAttribute('data-state', 'open'));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#0f1117',
    logging: false,
    windowWidth: 1120,
  });

  collapsed.forEach((el) => el.setAttribute('data-state', 'closed'));

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 5;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  let yOffset = 0;
  let page = 0;
  const maxContentPerPage = pageHeight - margin * 2;

  while (yOffset < contentHeight) {
    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, margin - yOffset, contentWidth, contentHeight);
    yOffset += maxContentPerPage;
    page += 1;
  }

  const date = new Date().toISOString().slice(0, 10);
  const safeName = investorName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  pdf.save(`ArthSaathi_${safeName}_${date}.pdf`);
}
