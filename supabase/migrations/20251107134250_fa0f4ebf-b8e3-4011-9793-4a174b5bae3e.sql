-- Create segment_templates table
CREATE TABLE segment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment TEXT NOT NULL,
  template_type TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_segment_templates_segment ON segment_templates(segment);
CREATE INDEX idx_segment_templates_type ON segment_templates(template_type);
CREATE INDEX idx_segment_templates_segment_type ON segment_templates(segment, template_type);

-- Trigger for updated_at
CREATE TRIGGER handle_segment_templates_updated_at 
  BEFORE UPDATE ON segment_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE segment_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write (for now, everyone can read)
CREATE POLICY "Anyone can view segment templates" 
  ON segment_templates 
  FOR SELECT 
  USING (true);

-- Add segment_specific_data column to companies table
ALTER TABLE companies 
ADD COLUMN segment_specific_data JSONB DEFAULT '{}'::jsonb;

-- Seed initial segment templates
-- SWOT Examples for Eventos
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('Eventos', 'swot', '{
  "strengths_examples": ["Equipe experiente em logística de eventos", "Portfolio diversificado de clientes corporativos e sociais", "Parcerias estratégicas com fornecedores de qualidade", "Flexibilidade para eventos de diversos tamanhos"],
  "weaknesses_examples": ["Alta dependência de sazonalidade (picos em dez/jul)", "Processos manuais de gestão e orçamento", "Equipe reduzida em baixa temporada", "Capacidade limitada de armazenamento de equipamentos"],
  "opportunities_examples": ["Crescimento do mercado de eventos corporativos pós-pandemia", "Tendência de eventos híbridos (presencial + online)", "Expansão para novas regiões geográficas", "Nichos específicos: casamentos temáticos, eventos sustentáveis"],
  "threats_examples": ["Instabilidade econômica reduzindo orçamentos corporativos", "Novos concorrentes com preços agressivos", "Regulamentações sanitárias e de segurança mais rigorosas", "Cancelamentos de última hora"]
}'::jsonb);

-- Questions for Eventos
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('Eventos', 'questions', '{
  "questions": [
    {
      "field": "sazonalidade",
      "label": "Como funciona a sazonalidade dos seus eventos?",
      "type": "textarea",
      "placeholder": "Ex: Pico em dezembro (festas de fim de ano) e julho (eventos corporativos de meio de ano)",
      "required": false
    },
    {
      "field": "tipos_evento",
      "label": "Principais tipos de eventos que você organiza",
      "type": "textarea",
      "placeholder": "Ex: Corporativos (palestras, confraternizações), Sociais (casamentos, formaturas), Feiras e Exposições",
      "required": false
    },
    {
      "field": "capacidade_mensal",
      "label": "Quantos eventos você consegue realizar por mês em alta temporada?",
      "type": "text",
      "placeholder": "Ex: 8-10 eventos/mês",
      "required": false
    },
    {
      "field": "ticket_medio",
      "label": "Qual o valor médio (ticket médio) dos seus eventos?",
      "type": "text",
      "placeholder": "Ex: R$ 15.000 a R$ 50.000 por evento",
      "required": false
    }
  ]
}'::jsonb);

-- KPIs for Eventos
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('Eventos', 'kpis', '{
  "suggested_kpis": [
    {
      "name": "Taxa de Ocupação",
      "description": "Percentual de eventos agendados em relação à capacidade máxima mensal",
      "formula": "(Eventos realizados / Capacidade máxima) × 100",
      "target_example": "85%"
    },
    {
      "name": "NPS dos Eventos",
      "description": "Net Promoter Score - Satisfação dos clientes após eventos",
      "formula": "% Promotores - % Detratores",
      "target_example": "8.5/10"
    },
    {
      "name": "Ticket Médio por Evento",
      "description": "Valor médio de faturamento por evento realizado",
      "formula": "Receita total / Número de eventos",
      "target_example": "R$ 25.000"
    },
    {
      "name": "Taxa de Retenção de Clientes",
      "description": "Percentual de clientes que contratam novamente",
      "formula": "(Clientes recorrentes / Total de clientes) × 100",
      "target_example": "40%"
    }
  ]
}'::jsonb);

-- SWOT Examples for SaaS
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('SaaS', 'swot', '{
  "strengths_examples": ["Modelo de receita recorrente previsível", "Produto escalável com baixo custo marginal", "Time técnico experiente", "Baixo churn rate"],
  "weaknesses_examples": ["Alto custo de aquisição de clientes (CAC)", "Dependência de poucos clientes grandes", "Produto ainda em fase de amadurecimento", "Suporte ao cliente limitado"],
  "opportunities_examples": ["Expansão internacional", "Novas funcionalidades baseadas em feedback", "Parcerias estratégicas com integradores", "Mercado de PMEs em crescimento"],
  "threats_examples": ["Concorrentes com mais capital investido", "Mudanças em regulamentações de privacidade (LGPD)", "Churn devido a crise econômica", "Dependência de plataformas terceiras (AWS, Stripe)"]
}'::jsonb);

-- Questions for SaaS
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('SaaS', 'questions', '{
  "questions": [
    {
      "field": "mrr_atual",
      "label": "Qual o MRR (Monthly Recurring Revenue) atual?",
      "type": "text",
      "placeholder": "Ex: R$ 50.000/mês",
      "required": false
    },
    {
      "field": "churn_rate",
      "label": "Qual a taxa de churn mensal atual?",
      "type": "text",
      "placeholder": "Ex: 3-5%",
      "required": false
    },
    {
      "field": "cac_ltv",
      "label": "Você conhece seu CAC e LTV?",
      "type": "textarea",
      "placeholder": "Ex: CAC = R$ 500, LTV = R$ 3.000 (LTV:CAC = 6:1)",
      "required": false
    },
    {
      "field": "modelo_preco",
      "label": "Qual o modelo de precificação?",
      "type": "textarea",
      "placeholder": "Ex: Freemium, Assinatura mensal (R$ 99, R$ 299, R$ 599), Por usuário",
      "required": false
    }
  ]
}'::jsonb);

-- KPIs for SaaS
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('SaaS', 'kpis', '{
  "suggested_kpis": [
    {
      "name": "MRR (Monthly Recurring Revenue)",
      "description": "Receita recorrente mensal",
      "formula": "Soma de todas as assinaturas ativas no mês",
      "target_example": "R$ 100.000/mês"
    },
    {
      "name": "Churn Rate",
      "description": "Taxa de cancelamento mensal",
      "formula": "(Clientes cancelados / Total de clientes início do mês) × 100",
      "target_example": "< 3%"
    },
    {
      "name": "CAC (Customer Acquisition Cost)",
      "description": "Custo para adquirir um novo cliente",
      "formula": "Investimento em marketing e vendas / Novos clientes",
      "target_example": "R$ 300"
    },
    {
      "name": "LTV:CAC Ratio",
      "description": "Relação entre valor do cliente e custo de aquisição",
      "formula": "LTV / CAC",
      "target_example": "3:1 (mínimo)"
    }
  ]
}'::jsonb);

-- SWOT Examples for Telecomunicações
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('Telecomunicações', 'swot', '{
  "strengths_examples": ["Infraestrutura de rede própria", "Base de clientes consolidada", "Contratos de longo prazo", "Diversificação de serviços (internet, telefonia, TV)"],
  "weaknesses_examples": ["Alto custo de manutenção de infraestrutura", "Dependência de licenças regulatórias", "Tecnologia legada em algumas regiões", "Alto índice de reclamações"],
  "opportunities_examples": ["Expansão de fibra óptica", "5G e IoT", "Bundling de serviços (convergência)", "Mercado B2B em crescimento"],
  "threats_examples": ["Regulamentação severa da Anatel", "Concorrência de players globais", "Pirataria de sinal", "Saturação do mercado"]
}'::jsonb);

-- SWOT Examples for Indústria
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('Indústria', 'swot', '{
  "strengths_examples": ["Capacidade produtiva instalada", "Certificações de qualidade (ISO)", "Equipe técnica especializada", "Relacionamento com fornecedores estratégicos"],
  "weaknesses_examples": ["Maquinário com necessidade de modernização", "Dependência de matéria-prima importada", "Processos produtivos manuais", "Alto custo de energia"],
  "opportunities_examples": ["Automação e Indústria 4.0", "Exportação para novos mercados", "Diversificação de produtos", "Parcerias tecnológicas"],
  "threats_examples": ["Volatilidade cambial", "Concorrência de produtos importados", "Escassez de mão de obra qualificada", "Regulamentações ambientais mais rigorosas"]
}'::jsonb);

-- SWOT Examples for Educação
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('Educação', 'swot', '{
  "strengths_examples": ["Corpo docente qualificado", "Metodologia de ensino diferenciada", "Infraestrutura moderna", "Boa reputação no mercado"],
  "weaknesses_examples": ["Dependência de mensalidades", "Alta inadimplência", "Dificuldade em reter professores", "Processos administrativos burocráticos"],
  "opportunities_examples": ["Ensino híbrido e EAD", "Cursos de especialização e MBA", "Parcerias internacionais", "Programas de educação corporativa"],
  "threats_examples": ["Concorrência de plataformas online", "Redução da taxa de natalidade", "Crise econômica afetando matrículas", "Regulamentações do MEC"]
}'::jsonb);

-- SWOT Examples for Saúde
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('Saúde', 'swot', '{
  "strengths_examples": ["Equipe médica especializada", "Equipamentos modernos", "Convênios com principais operadoras", "Localização estratégica"],
  "weaknesses_examples": ["Alto custo operacional", "Dependência de repasses de convênios", "Rotatividade de profissionais", "Processos de agendamento manuais"],
  "opportunities_examples": ["Telemedicina e atendimento remoto", "Programas de prevenção e check-ups", "Expansão de especialidades", "Parcerias com empresas (medicina ocupacional)"],
  "threats_examples": ["Tabelas de convênios defasadas", "Judicialização da saúde", "Falta de profissionais especializados", "Regulamentações sanitárias complexas"]
}'::jsonb);

-- SWOT Examples for Varejo
INSERT INTO segment_templates (segment, template_type, template_data) VALUES
('Varejo', 'swot', '{
  "strengths_examples": ["Localização privilegiada", "Mix de produtos diversificado", "Relacionamento com clientes", "Presença online e offline"],
  "weaknesses_examples": ["Margens apertadas", "Dependência de fornecedores", "Estoque parado", "Sistema de gestão limitado"],
  "opportunities_examples": ["E-commerce e omnichannel", "Marketplace e dropshipping", "Programas de fidelidade digital", "Experiência de compra personalizada"],
  "threats_examples": ["Concorrência de gigantes do e-commerce", "Mudança no comportamento do consumidor", "Alto custo de aquisição digital", "Crises econômicas reduzindo consumo"]
}'::jsonb);