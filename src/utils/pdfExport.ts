import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  watermark?: boolean;
  watermarkText?: string;
  companyName?: string;
  companyLogo?: string;
  canExport?: boolean;
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
    orientation = 'portrait',
    watermark = false,
    watermarkText = 'Criado com LEGAL Strategic Planner - Faça upgrade para remover',
    canExport = true
  } = options;

  // Block export if user doesn't have permission
  if (!canExport) {
    throw new Error('Exportação de PDF não disponível no seu plano. Faça upgrade para desbloquear!');
  }

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
      
      // Add watermark if enabled (for FREE users)
      if (watermark) {
        pdf.setFontSize(10);
        pdf.setTextColor(200, 200, 200);
        pdf.text(
          watermarkText,
          pageWidth / 2,
          pageHeight / 2,
          { align: 'center', angle: 45 }
        );
      }
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
    orientation = 'portrait',
    watermark = false,
    watermarkText = 'Criado com LEGAL Strategic Planner - Faça upgrade para remover',
    canExport = true
  } = options;

  // Block export if user doesn't have permission
  if (!canExport) {
    throw new Error('Exportação de PDF não disponível no seu plano. Faça upgrade para desbloquear!');
  }

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

    // Add page numbers and watermark
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
      
      // Add watermark if enabled (for FREE users)
      if (watermark) {
        pdf.setFontSize(10);
        pdf.setTextColor(200, 200, 200);
        pdf.text(
          watermarkText,
          pageWidth / 2,
          pageHeight / 2,
          { align: 'center', angle: 45 }
        );
      }
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Interface for comprehensive strategic plan data
export interface StrategicPlanData {
  company: {
    name: string;
    mission?: string;
    vision?: string;
    values?: string;
  };
  ogsm?: {
    objective: string;
    goals: any[];
    strategies: any[];
    measures: any[];
  };
  okrs?: any[];
  bsc?: any;
  matriz?: any;
  pestel?: any;
  wbr?: any;
  objectives?: any[];
  insights?: any[];
}

// Helper function to add logo/watermark image
const addLogoWatermark = (pdf: jsPDF, logoPath: string, watermark: boolean) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  if (watermark) {
    // Add as semi-transparent watermark in center with 15% opacity
    try {
      pdf.saveGraphicsState();
      pdf.setGState({ opacity: 0.15 });
      pdf.addImage(logoPath, 'PNG', pageWidth / 2 - 30, pageHeight / 2 - 30, 60, 60, undefined, 'NONE');
      pdf.restoreGraphicsState();
    } catch (e) {
      console.log('Could not add watermark logo');
    }
  }
};

// Main function to export complete strategic plan
export const exportStrategicPlanToPDF = async (
  data: StrategicPlanData,
  options: PDFExportOptions = {}
) => {
  const {
    filename = 'plano-estrategico-completo.pdf',
    title = 'Plano Estratégico',
    orientation = 'portrait',
    watermark = false,
    companyLogo = '/legal-logo.png',
    canExport = true
  } = options;

  if (!canExport) {
    throw new Error('Exportação de PDF não disponível no seu plano. Faça upgrade para desbloquear!');
  }

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Helper to add section title
    const addSectionTitle = (sectionTitle: string) => {
      checkNewPage(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(37, 99, 235);
      pdf.text(sectionTitle, margin, yPos);
      yPos += 8;
      pdf.setDrawColor(37, 99, 235);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
    };

    // Helper to add normal text
    const addText = (text: string, fontSize = 10, color: [number, number, number] = [60, 60, 60], bold = false) => {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setFontSize(fontSize);
      pdf.setTextColor(...color);
      const lines = pdf.splitTextToSize(text, contentWidth);
      
      for (const line of lines) {
        checkNewPage(8);
        pdf.text(line, margin, yPos);
        yPos += 6;
      }
      yPos += 3;
    };

    // ============= CAPA =============
    pdf.addPage();
    yPos = pageHeight / 3;
    
    // Add logo if exists
    try {
      pdf.addImage(companyLogo, 'PNG', pageWidth / 2 - 25, yPos, 50, 50);
      yPos += 60;
    } catch (e) {
      console.log('Logo not available for cover');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(37, 99, 235);
    pdf.text(title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(60, 60, 60);
    pdf.text(data.company.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      new Date().toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );

    // ============= RESUMO EXECUTIVO =============
    pdf.addPage();
    yPos = margin;
    addSectionTitle('Resumo Executivo');
    
    if (data.company.mission) {
      pdf.setFontSize(11);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Missão', margin, yPos);
      yPos += 7;
      addText(data.company.mission);
    }
    
    if (data.company.vision) {
      pdf.setFontSize(11);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Visão', margin, yPos);
      yPos += 7;
      addText(data.company.vision);
    }
    
    if (data.company.values) {
      pdf.setFontSize(11);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Valores', margin, yPos);
      yPos += 7;
      addText(data.company.values);
    }

    yPos += 5;
    addText(`Total de Objetivos Estratégicos: ${data.objectives?.length || 0}`, 11, [37, 99, 235]);
    addText(`Total de Iniciativas: ${data.objectives?.reduce((acc, obj) => acc + (obj.initiatives?.length || 0), 0) || 0}`, 11, [37, 99, 235]);
    addText(`Total de Métricas: ${data.objectives?.reduce((acc, obj) => acc + (obj.metrics?.length || 0), 0) || 0}`, 11, [37, 99, 235]);

    // ============= OGSM =============
    if (data.ogsm) {
      pdf.addPage();
      yPos = margin;
      addSectionTitle('OGSM - Objective, Goals, Strategies, Measures');
      
      pdf.setFontSize(11);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Objetivo', margin, yPos);
      yPos += 7;
      addText(data.ogsm.objective);
      
      if (data.ogsm.goals?.length > 0) {
        yPos += 5;
        pdf.setFontSize(11);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Goals (Metas)', margin, yPos);
        yPos += 7;
        
        data.ogsm.goals.forEach((goal: any, idx: number) => {
          addText(`${idx + 1}. ${goal.title}`);
          if (goal.mensuravel) {
            addText(`   Mensurável: ${goal.mensuravel}`, 9, [100, 100, 100]);
          }
        });
      }
      
      if (data.ogsm.strategies?.length > 0) {
        checkNewPage(30);
        yPos += 5;
        pdf.setFontSize(11);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Strategies (Estratégias)', margin, yPos);
        yPos += 7;
        
        data.ogsm.strategies.forEach((strategy: any, idx: number) => {
          addText(`${idx + 1}. ${strategy.title}`);
          if (strategy.description) {
            addText(`   ${strategy.description}`, 9, [100, 100, 100]);
          }
        });
      }
    }

    // ============= OKRs =============
    if (data.okrs && data.okrs.length > 0) {
      pdf.addPage();
      yPos = margin;
      addSectionTitle('OKRs - Objectives and Key Results');
      
      data.okrs.forEach((okr: any, idx: number) => {
        checkNewPage(40);
        pdf.setFontSize(11);
        pdf.setTextColor(37, 99, 235);
        pdf.text(`Objetivo ${idx + 1}: ${okr.objective}`, margin, yPos);
        yPos += 8;
        
        if (okr.key_results && okr.key_results.length > 0) {
          okr.key_results.forEach((kr: any, krIdx: number) => {
            addText(`KR${krIdx + 1}: ${kr.kr}`, 10);
            addText(`   Meta: ${kr.target} | Métrica: ${kr.metrica}`, 9, [100, 100, 100]);
          });
        }
        yPos += 5;
      });
    }

    // ============= BSC =============
    if (data.bsc) {
      pdf.addPage();
      yPos = margin;
      addSectionTitle('Balanced Scorecard - Perspectivas');
      
      const perspectives = [
        { key: 'financeira', label: 'Perspectiva Financeira', color: [34, 139, 34] as [number, number, number] },
        { key: 'clientes', label: 'Perspectiva de Clientes', color: [37, 99, 235] as [number, number, number] },
        { key: 'processos', label: 'Perspectiva de Processos Internos', color: [234, 179, 8] as [number, number, number] },
        { key: 'aprendizado', label: 'Perspectiva de Aprendizado e Crescimento', color: [168, 85, 247] as [number, number, number] }
      ];
      
      perspectives.forEach(p => {
        checkNewPage(30);
        pdf.setFontSize(11);
        pdf.setTextColor(...p.color);
        pdf.text(p.label, margin, yPos);
        yPos += 7;
        
        const perspective = data.bsc[p.key];
        if (perspective?.itens && perspective.itens.length > 0) {
          perspective.itens.forEach((item: string) => {
            addText(`• ${item}`, 10);
          });
        } else if (perspective?.sugestao) {
          addText(`Sugestão: ${perspective.sugestao}`, 9, [120, 120, 120]);
        }
        yPos += 5;
      });
    }

    // ============= MATRIZ IMPACTO x ESFORÇO =============
    if (data.matriz) {
      pdf.addPage();
      yPos = margin;
      addSectionTitle('Matriz Impacto x Esforço - Priorização de Iniciativas');
      
      const quadrants = [
        { key: 'fazer_agora', label: 'Fazer Agora (Alto Impacto, Baixo Esforço)', color: [34, 139, 34] as [number, number, number] },
        { key: 'planejar', label: 'Planejar (Alto Impacto, Alto Esforço)', color: [37, 99, 235] as [number, number, number] },
        { key: 'oportunidades_rapidas', label: 'Oportunidades Rápidas (Baixo Impacto, Baixo Esforço)', color: [234, 179, 8] as [number, number, number] },
        { key: 'evitar', label: 'Evitar (Baixo Impacto, Alto Esforço)', color: [220, 38, 38] as [number, number, number] }
      ];
      
      quadrants.forEach(q => {
        const items = data.matriz[q.key];
        if (items && items.length > 0) {
          checkNewPage(30);
          pdf.setFontSize(11);
          pdf.setTextColor(...q.color);
          pdf.text(q.label, margin, yPos);
          yPos += 7;
          
          items.forEach((item: any) => {
            addText(`• ${item.titulo}`, 10);
            if (item.justificativa) {
              addText(`  ${item.justificativa}`, 9, [100, 100, 100]);
            }
          });
          yPos += 5;
        }
      });
    }

    // ============= PESTEL =============
    if (data.pestel) {
      pdf.addPage();
      yPos = margin;
      addSectionTitle('Análise PESTEL - Fatores Externos');
      
      const pestelFactors = [
        { key: 'politico', label: 'Político' },
        { key: 'economico', label: 'Econômico' },
        { key: 'social', label: 'Social' },
        { key: 'tecnologico', label: 'Tecnológico' },
        { key: 'ambiental', label: 'Ambiental' },
        { key: 'legal', label: 'Legal' }
      ];
      
      pestelFactors.forEach(f => {
        if (data.pestel[f.key]) {
          checkNewPage(25);
          pdf.setFontSize(11);
          pdf.setTextColor(37, 99, 235);
          pdf.text(f.label, margin, yPos);
          yPos += 7;
          addText(data.pestel[f.key]);
          yPos += 3;
        }
      });
      
      if (data.pestel.key_impacts?.length > 0) {
        checkNewPage(25);
        pdf.setFontSize(11);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Impactos-Chave', margin, yPos);
        yPos += 7;
        data.pestel.key_impacts.forEach((impact: string) => {
          addText(`• ${impact}`, 10);
        });
      }
      
      if (data.pestel.opportunities?.length > 0) {
        checkNewPage(25);
        pdf.setFontSize(11);
        pdf.setTextColor(34, 139, 34);
        pdf.text('Oportunidades', margin, yPos);
        yPos += 7;
        data.pestel.opportunities.forEach((opp: string) => {
          addText(`• ${opp}`, 10);
        });
      }
      
      if (data.pestel.threats?.length > 0) {
        checkNewPage(25);
        pdf.setFontSize(11);
        pdf.setTextColor(220, 38, 38);
        pdf.text('Ameaças', margin, yPos);
        yPos += 7;
        data.pestel.threats.forEach((threat: string) => {
          addText(`• ${threat}`, 10);
        });
      }
    }

    // ============= WBR =============
    if (data.wbr) {
      pdf.addPage();
      yPos = margin;
      addSectionTitle('WBR - Weekly Business Review');
      
      pdf.setFontSize(11);
      pdf.setTextColor(37, 99, 235);
      pdf.text('MCI - Meta Crítica Imediata', margin, yPos);
      yPos += 7;
      addText(data.wbr.mci || 'Não definido');
      
      if (data.wbr.cadencia) {
        checkNewPage(25);
        yPos += 5;
        pdf.setFontSize(11);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Cadência de Revisão', margin, yPos);
        yPos += 7;
        addText(`Tipo: ${data.wbr.cadencia.reuniao_tipo || 'Weekly Business Review'}`, 10);
        addText(`Frequência: ${data.wbr.cadencia.frequencia || 'Semanal'}`, 10);
        addText(`Duração: ${data.wbr.cadencia.duracao || '30-45 minutos'}`, 10);
      }
    }

    // ============= OBJETIVOS ESTRATÉGICOS DETALHADOS =============
    if (data.objectives && data.objectives.length > 0) {
      pdf.addPage();
      yPos = margin;
      addSectionTitle('Objetivos Estratégicos Detalhados');
      
      data.objectives.forEach((obj: any, idx: number) => {
        checkNewPage(40);
        pdf.setFontSize(12);
        pdf.setTextColor(37, 99, 235);
        pdf.text(`${idx + 1}. ${obj.title}`, margin, yPos);
        yPos += 8;
        
        if (obj.description) {
          addText(obj.description);
        }
        
        if (obj.perspective) {
          addText(`Perspectiva BSC: ${obj.perspective}`, 9, [100, 100, 100]);
        }
        
        // Iniciativas
        if (obj.initiatives && obj.initiatives.length > 0) {
          checkNewPage(20);
          yPos += 3;
          pdf.setFontSize(10);
          pdf.setTextColor(60, 60, 60);
          pdf.text('Iniciativas:', margin + 5, yPos);
          yPos += 6;
          
          obj.initiatives.forEach((init: any) => {
            addText(`  • ${init.title}`, 9);
            if (init.status) {
              addText(`    Status: ${init.status}`, 8, [120, 120, 120]);
            }
          });
        }
        
        // Métricas
        if (obj.metrics && obj.metrics.length > 0) {
          checkNewPage(20);
          yPos += 3;
          pdf.setFontSize(10);
          pdf.setTextColor(60, 60, 60);
          pdf.text('Métricas:', margin + 5, yPos);
          yPos += 6;
          
          obj.metrics.forEach((metric: any) => {
            addText(`  • ${metric.name}`, 9);
            if (metric.current_value && metric.target) {
              addText(`    Atual: ${metric.current_value} | Meta: ${metric.target}`, 8, [120, 120, 120]);
            }
          });
        }
        
        yPos += 8;
      });
    }

    // ============= INSIGHTS DE IA =============
    if (data.insights && data.insights.length > 0) {
      pdf.addPage();
      yPos = margin;
      addSectionTitle('Insights de IA');
      
      data.insights.forEach((insight: any, idx: number) => {
        checkNewPage(30);
        pdf.setFontSize(11);
        
        // Color based on type
        const typeColors: Record<string, [number, number, number]> = {
          'progresso': [34, 139, 34],
          'risco': [220, 38, 38],
          'oportunidade': [37, 99, 235],
          'recomendacao': [234, 179, 8]
        };
        const color = typeColors[insight.insight_type] || [60, 60, 60];
        
        pdf.setTextColor(...color);
        pdf.text(`${idx + 1}. ${insight.title}`, margin, yPos);
        yPos += 7;
        
        addText(insight.description);
        
        addText(`Tipo: ${insight.insight_type} | Prioridade: ${insight.priority}`, 8, [120, 120, 120]);
        yPos += 5;
      });
    }

    // ============= ADD WATERMARK AND FOOTERS TO ALL PAGES =============
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Page number
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
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );
      
      // Add watermark if enabled
      if (watermark) {
        addLogoWatermark(pdf, companyLogo, true);
      }
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating comprehensive PDF:', error);
    throw error;
  }
};
