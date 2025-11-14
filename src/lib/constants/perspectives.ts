export const BSC_PERSPECTIVES = {
  FINANCEIRA: 'financeira',
  CLIENTES: 'clientes',
  PROCESSOS: 'processos',
  APRENDIZADO: 'aprendizado'
} as const;

export const BSC_PERSPECTIVE_LABELS = {
  [BSC_PERSPECTIVES.FINANCEIRA]: 'Financeira',
  [BSC_PERSPECTIVES.CLIENTES]: 'Clientes',
  [BSC_PERSPECTIVES.PROCESSOS]: 'Processos Internos',
  [BSC_PERSPECTIVES.APRENDIZADO]: 'Aprendizado e Crescimento'
} as const;

export type BSCPerspective = typeof BSC_PERSPECTIVES[keyof typeof BSC_PERSPECTIVES];

// Mapeamento de variações de nomes para normalização
export const PERSPECTIVE_VARIATIONS: Record<string, string[]> = {
  [BSC_PERSPECTIVES.FINANCEIRA]: ['financeira', 'Financeira', 'financeiro', 'Financeiro'],
  [BSC_PERSPECTIVES.CLIENTES]: ['clientes', 'Clientes'],
  [BSC_PERSPECTIVES.PROCESSOS]: ['processos', 'Processos', 'processos internos', 'Processos Internos'],
  [BSC_PERSPECTIVES.APRENDIZADO]: ['aprendizado', 'Aprendizado', 'crescimento', 'Crescimento', 'aprendizado e crescimento', 'Aprendizado e Crescimento']
};
