// Excel export utility
// Note: For production, consider using a library like xlsx or exceljs

export interface ExcelSheet {
  name: string;
  headers: string[];
  data: any[][];
}

export interface ExcelExportOptions {
  filename?: string;
  sheets: ExcelSheet[];
}

/**
 * Export data to CSV format (simplified Excel alternative)
 * For full Excel support with multiple sheets and formatting,
 * consider using the 'xlsx' library
 */
export const exportToCSV = (data: any[][], filename: string = 'export.csv') => {
  const csvContent = data
    .map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
    .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export multiple sheets to CSV (one file per sheet)
 */
export const exportMultipleSheetsToCSV = (options: ExcelExportOptions) => {
  const { sheets, filename = 'export' } = options;
  
  sheets.forEach((sheet) => {
    const data = [sheet.headers, ...sheet.data];
    const sheetFilename = `${filename}_${sheet.name.replace(/\s+/g, '_').toLowerCase()}.csv`;
    exportToCSV(data, sheetFilename);
  });
};

/**
 * Format strategic plan data for Excel export
 */
export const formatStrategicPlanForExcel = (data: {
  objectives: any[];
  initiatives: any[];
  metrics: any[];
  company: any;
}) => {
  const sheets: ExcelSheet[] = [];

  // Summary sheet
  sheets.push({
    name: 'Resumo',
    headers: ['Empresa', 'Segmento', 'Modelo', 'Total Objetivos', 'Total Iniciativas', 'Total Métricas'],
    data: [[
      data.company?.name || 'N/A',
      data.company?.segment || 'N/A',
      data.company?.model || 'N/A',
      data.objectives?.length || 0,
      data.initiatives?.length || 0,
      data.metrics?.length || 0,
    ]],
  });

  // Objectives sheet
  if (data.objectives && data.objectives.length > 0) {
    sheets.push({
      name: 'Objetivos',
      headers: ['ID', 'Título', 'Descrição', 'Perspectiva', 'Prioridade', 'Status', 'Progresso (%)'],
      data: data.objectives.map((obj: any) => [
        obj.id,
        obj.title,
        obj.description || '',
        obj.perspective || '',
        obj.priority || '',
        obj.latest_update?.status || 'não iniciado',
        obj.latest_update?.progress_percentage || 0,
      ]),
    });
  }

  // Initiatives sheet
  if (data.initiatives && data.initiatives.length > 0) {
    sheets.push({
      name: 'Iniciativas',
      headers: [
        'ID', 'Título', 'Objetivo', 'Status', 'ICE Score', 'Impacto', 'Confiança', 'Facilidade',
        'O Quê', 'Por Quê', 'Quem', 'Onde', 'Quando', 'Como', 'Quanto'
      ],
      data: data.initiatives.map((init: any) => [
        init.id,
        init.title,
        init.strategic_objectives?.title || '',
        init.status || '',
        init.ice_score || '',
        init.impact_score || '',
        init.confidence_score || '',
        init.ease_score || '',
        init.what || '',
        init.why || '',
        init.who || '',
        init.where_location || '',
        init.when_deadline || '',
        init.how || '',
        init.how_much || '',
      ]),
    });
  }

  // Metrics sheet
  if (data.metrics && data.metrics.length > 0) {
    sheets.push({
      name: 'Métricas',
      headers: ['ID', 'Nome', 'Objetivo', 'Valor Atual', 'Meta', 'Período', 'Fonte'],
      data: data.metrics.map((metric: any) => [
        metric.id,
        metric.name,
        metric.strategic_objectives?.title || '',
        metric.current_value || '',
        metric.target || '',
        metric.period || '',
        metric.source || '',
      ]),
    });
  }

  return sheets;
};

/**
 * Export strategic plan to CSV files
 */
export const exportStrategicPlanToExcel = (data: {
  objectives: any[];
  initiatives: any[];
  metrics: any[];
  company: any;
}, filename?: string) => {
  const sheets = formatStrategicPlanForExcel(data);
  exportMultipleSheetsToCSV({
    sheets,
    filename: filename || `plano_estrategico_${new Date().toISOString().split('T')[0]}`,
  });
};
