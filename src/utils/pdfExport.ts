import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  watermark?: boolean;
  companyName?: string;
  companyLogo?: string;
}

export interface ExcelExportData {
  sheets: {
    name: string;
    data: any[][];
    headers: string[];
  }[];
  filename?: string;
}

export const exportToPDF = async (
  elementId: string,
  options: PDFExportOptions = {}
) => {
  const {
    filename = 'plano-estrategico.pdf',
    title = 'Plano Estratégico',
    subtitle = new Date().toLocaleDateString('pt-BR'),
    orientation = 'portrait'
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    // Add title page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Title
    pdf.setFontSize(24);
    pdf.setTextColor(37, 99, 235); // primary color
    pdf.text(title, pageWidth / 2, 40, { align: 'center' });

    // Subtitle
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(subtitle, pageWidth / 2, 50, { align: 'center' });

    // Add separator
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, 60, pageWidth - 20, 60);

    // Calculate image dimensions
    const imgWidth = pageWidth - 20; // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 70; // Start below title

    // Add first page with image
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - position);

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add footer to all pages
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      pdf.text(
        'Gerado por Estratégia IA',
        pageWidth - 20,
        pageHeight - 10,
        { align: 'right' }
      );
    }

    // Save the PDF
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportMultipleSectionsToPDF = async (
  sections: { id: string; title: string }[],
  options: PDFExportOptions = {}
) => {
  const {
    filename = 'plano-estrategico-completo.pdf',
    title = 'Plano Estratégico Completo',
    orientation = 'portrait'
  } = options;

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Title page
    pdf.setFontSize(28);
    pdf.setTextColor(37, 99, 235);
    pdf.text(title, pageWidth / 2, 50, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      new Date().toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      pageWidth / 2,
      65,
      { align: 'center' }
    );

    let isFirstSection = true;

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (!element) continue;

      if (!isFirstSection) {
        pdf.addPage();
      } else {
        isFirstSection = false;
        pdf.addPage();
      }

      // Add section title
      pdf.setFontSize(18);
      pdf.setTextColor(37, 99, 235);
      pdf.text(section.title, 20, 20);

      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 25, pageWidth - 20, 25);

      // Capture section as image
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 35;

      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position - 15);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 20, position + 20, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 30);
      }
    }

    // Add page numbers
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `${i} / ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
