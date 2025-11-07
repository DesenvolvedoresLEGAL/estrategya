/**
 * PowerPoint export utility
 * 
 * For production-grade PowerPoint generation, consider using:
 * - pptxgenjs: https://www.npmjs.com/package/pptxgenjs
 * - officegen: https://www.npmjs.com/package/officegen
 * 
 * This is a simplified version that generates HTML slides
 * that can be converted to PowerPoint manually or via online tools
 */

export interface PPTSlide {
  title: string;
  content: string[];
  notes?: string;
  layout?: 'title' | 'content' | 'two-column' | 'chart';
}

export interface PPTExportOptions {
  title: string;
  subtitle?: string;
  author?: string;
  slides: PPTSlide[];
  theme?: 'light' | 'dark' | 'corporate';
}

/**
 * Generate HTML presentation that can be printed to PDF or converted to PPTX
 */
export const generateHTMLPresentation = (options: PPTExportOptions): string => {
  const { title, subtitle, author, slides, theme = 'corporate' } = options;

  const themeColors = {
    light: {
      bg: '#ffffff',
      text: '#1f2937',
      accent: '#3b82f6',
      secondary: '#f3f4f6',
    },
    dark: {
      bg: '#1f2937',
      text: '#f9fafb',
      accent: '#60a5fa',
      secondary: '#374151',
    },
    corporate: {
      bg: '#ffffff',
      text: '#1e293b',
      accent: '#2563eb',
      secondary: '#e2e8f0',
    },
  };

  const colors = themeColors[theme];

  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: ${colors.bg};
        color: ${colors.text};
      }
      
      .slide {
        width: 1024px;
        height: 768px;
        padding: 60px 80px;
        page-break-after: always;
        display: flex;
        flex-direction: column;
        background: ${colors.bg};
        position: relative;
      }
      
      .slide-title {
        width: 1024px;
        height: 768px;
        padding: 60px 80px;
        page-break-after: always;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.accent}dd 100%);
        color: white;
      }
      
      .slide-title h1 {
        font-size: 64px;
        font-weight: 700;
        margin-bottom: 24px;
        line-height: 1.2;
      }
      
      .slide-title h2 {
        font-size: 32px;
        font-weight: 300;
        opacity: 0.9;
        margin-bottom: 48px;
      }
      
      .slide-title .author {
        font-size: 18px;
        opacity: 0.8;
        margin-top: 40px;
      }
      
      .slide h2 {
        font-size: 48px;
        font-weight: 700;
        color: ${colors.accent};
        margin-bottom: 40px;
        border-bottom: 4px solid ${colors.accent};
        padding-bottom: 16px;
      }
      
      .slide .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      
      .slide .content-item {
        font-size: 24px;
        line-height: 1.6;
        padding-left: 32px;
        position: relative;
      }
      
      .slide .content-item:before {
        content: '•';
        position: absolute;
        left: 0;
        color: ${colors.accent};
        font-weight: bold;
        font-size: 32px;
      }
      
      .slide .two-column {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        flex: 1;
      }
      
      .slide .column {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .slide .footer {
        position: absolute;
        bottom: 30px;
        left: 80px;
        right: 80px;
        font-size: 14px;
        color: ${colors.text};
        opacity: 0.5;
        display: flex;
        justify-content: space-between;
      }
      
      .notes {
        display: none;
        background: ${colors.secondary};
        padding: 20px;
        margin-top: 20px;
        border-left: 4px solid ${colors.accent};
        font-size: 14px;
        line-height: 1.6;
      }
      
      @media print {
        .slide, .slide-title {
          page-break-after: always;
          margin: 0;
        }
        .notes {
          display: block;
          page-break-before: avoid;
        }
      }
    </style>
  `;

  const titleSlide = `
    <div class="slide-title">
      <h1>${title}</h1>
      ${subtitle ? `<h2>${subtitle}</h2>` : ''}
      ${author ? `<div class="author">Apresentado por: ${author}</div>` : ''}
    </div>
  `;

  const contentSlides = slides.map((slide, index) => {
    let content = '';
    
    if (slide.layout === 'two-column' && slide.content.length >= 2) {
      const mid = Math.ceil(slide.content.length / 2);
      content = `
        <div class="two-column">
          <div class="column">
            ${slide.content.slice(0, mid).map(item => `<div class="content-item">${item}</div>`).join('')}
          </div>
          <div class="column">
            ${slide.content.slice(mid).map(item => `<div class="content-item">${item}</div>`).join('')}
          </div>
        </div>
      `;
    } else {
      content = `
        <div class="content">
          ${slide.content.map(item => `<div class="content-item">${item}</div>`).join('')}
        </div>
      `;
    }

    return `
      <div class="slide">
        <h2>${slide.title}</h2>
        ${content}
        <div class="footer">
          <span>${title}</span>
          <span>Slide ${index + 1} de ${slides.length}</span>
        </div>
      </div>
      ${slide.notes ? `<div class="notes"><strong>Notas do apresentador:</strong><br>${slide.notes}</div>` : ''}
    `;
  }).join('\n');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${styles}
    </head>
    <body>
      ${titleSlide}
      ${contentSlides}
      <script>
        // Add keyboard navigation
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide, .slide-title');
        
        function showSlide(n) {
          slides.forEach((slide, i) => {
            slide.style.display = i === n ? 'flex' : 'none';
          });
        }
        
        document.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === ' ') {
            currentSlide = Math.min(currentSlide + 1, slides.length - 1);
            showSlide(currentSlide);
          } else if (e.key === 'ArrowLeft') {
            currentSlide = Math.max(currentSlide - 1, 0);
            showSlide(currentSlide);
          }
        });
        
        showSlide(0);
      </script>
    </body>
    </html>
  `;
};

/**
 * Open presentation in new window
 */
export const openPresentation = (options: PPTExportOptions) => {
  const html = generateHTMLPresentation(options);
  const newWindow = window.open('', '_blank');
  
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  } else {
    alert('Por favor, permita pop-ups para visualizar a apresentação');
  }
};

/**
 * Download presentation as HTML file
 */
export const downloadPresentation = (options: PPTExportOptions, filename?: string) => {
  const html = generateHTMLPresentation(options);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename || `${options.title.replace(/\s+/g, '_').toLowerCase()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format strategic plan for PowerPoint
 */
export const formatStrategicPlanForPPT = (data: {
  company: any;
  objectives: any[];
  initiatives: any[];
  metrics: any[];
  swot?: any;
  ogsm?: any;
}): PPTExportOptions => {
  const slides: PPTSlide[] = [];

  // Slide 2: Visão Geral
  slides.push({
    title: 'Visão Geral',
    content: [
      `Empresa: ${data.company?.name || 'N/A'}`,
      `Segmento: ${data.company?.segment || 'N/A'}`,
      `Total de Objetivos: ${data.objectives?.length || 0}`,
      `Total de Iniciativas: ${data.initiatives?.length || 0}`,
      `Métricas Acompanhadas: ${data.metrics?.length || 0}`,
    ],
    notes: 'Apresentar contexto geral da empresa e do plano estratégico',
  });

  // Slide 3: SWOT (if available)
  if (data.swot) {
    slides.push({
      title: 'Análise SWOT',
      content: [
        `<strong>Forças:</strong> ${data.swot.strengths?.slice(0, 2).join(', ')}`,
        `<strong>Fraquezas:</strong> ${data.swot.weaknesses?.slice(0, 2).join(', ')}`,
        `<strong>Oportunidades:</strong> ${data.swot.opportunities?.slice(0, 2).join(', ')}`,
        `<strong>Ameaças:</strong> ${data.swot.threats?.slice(0, 2).join(', ')}`,
      ],
      layout: 'two-column',
      notes: 'Detalhar cada ponto da análise SWOT com exemplos práticos',
    });
  }

  // Slide 4: Objetivos Estratégicos
  const topObjectives = data.objectives?.slice(0, 5) || [];
  if (topObjectives.length > 0) {
    slides.push({
      title: 'Objetivos Estratégicos',
      content: topObjectives.map(obj => 
        `${obj.title} (${obj.perspective || 'Geral'})`
      ),
      notes: 'Explicar a importância de cada objetivo e como eles se relacionam',
    });
  }

  // Slide 5: Top Iniciativas
  const topInitiatives = data.initiatives
    ?.filter(i => i.ice_score)
    ?.sort((a, b) => (b.ice_score || 0) - (a.ice_score || 0))
    ?.slice(0, 5) || [];

  if (topInitiatives.length > 0) {
    slides.push({
      title: 'Top 5 Iniciativas (ICE Score)',
      content: topInitiatives.map(init => 
        `${init.title} - Score: ${init.ice_score || 'N/A'}`
      ),
      notes: 'Detalhar critérios de priorização e próximos passos para cada iniciativa',
    });
  }

  // Slide 6: Métricas Chave
  const topMetrics = data.metrics?.slice(0, 5) || [];
  if (topMetrics.length > 0) {
    slides.push({
      title: 'Métricas Chave de Desempenho',
      content: topMetrics.map(metric => 
        `${metric.name}: ${metric.current_value || 'N/A'} / ${metric.target || 'N/A'}`
      ),
      notes: 'Explicar metodologia de medição e frequência de atualização',
    });
  }

  // Slide 7: Próximos Passos
  slides.push({
    title: 'Próximos Passos',
    content: [
      'Alinhamento com equipes executoras',
      'Definição de responsáveis por iniciativa',
      'Estabelecimento de cadência de reviews',
      'Implementação de sistema de tracking',
      'Ajustes baseados em feedback inicial',
    ],
    notes: 'Definir timeline e responsabilidades para cada próximo passo',
  });

  return {
    title: `Plano Estratégico - ${data.company?.name || 'Empresa'}`,
    subtitle: new Date().toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    author: data.company?.owner_user_id,
    slides,
    theme: 'corporate',
  };
};
