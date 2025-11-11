import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { initiative, objective, company, estimate_budget_only } = await req.json();
    
    if (!initiative) {
      throw new Error('Dados da iniciativa não fornecidos');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em planejamento estratégico e metodologia 5W2H.
Sua missão é transformar iniciativas estratégicas em planos de ação concretos e executáveis.

A metodologia 5W2H responde:
- What (O que): Descrição clara e específica da ação
- Why (Por que): Justificativa estratégica e impacto esperado
- Who (Quem): Responsável pela execução (cargo/área) - considere o porte e estrutura da empresa
- When (Quando): Prazo realista baseado na complexidade da iniciativa
- Where (Onde): Local/contexto de execução
- How (Como): Passos detalhados de execução
- How much (Quanto): Estimativa de investimento realista baseada no segmento da empresa

DIRETRIZES PARA BUDGETS REALISTAS POR SEGMENTO:
- Telecom: Infraestrutura cara (R$ 20k-200k), considere equipamentos e licenças
- SaaS: Desenvolvimento (R$ 10k-100k), considere tecnologia e marketing digital
- Eventos: Variável (R$ 5k-150k), considere logística, espaço e fornecedores
- Indústria: Alto custo (R$ 30k-300k), considere maquinário e matéria-prima
- Saúde: Médio-alto (R$ 15k-200k), considere equipamentos e treinamento
- Varejo: Variável (R$ 5k-100k), considere estoque, marketing e tecnologia
- Serviços: Médio (R$ 8k-80k), considere pessoal e marketing

COMPLEXIDADE E PRAZOS:
- Baixa complexidade: 30-60 dias
- Média complexidade: 60-120 dias
- Alta complexidade: 120-180 dias

RESPONSÁVEIS BASEADOS NO PORTE:
- Pequeno porte (<20 funcionários): Indicar áreas (ex: "Equipe de Marketing", "Responsável Comercial")
- Médio porte (20-100): Indicar gerências (ex: "Gerente de Operações")
- Grande porte (>100): Indicar diretorias (ex: "Diretor de TI")`;

    // Se for apenas estimativa de budget
    if (estimate_budget_only) {
      const budgetPrompt = `Estime o investimento necessário para esta iniciativa:

INICIATIVA: ${initiative.title}
DESCRIÇÃO: ${initiative.description || 'Não informada'}
O QUE SERÁ FEITO: ${initiative.what || 'Não informado'}
COMO SERÁ FEITO: ${initiative.how || 'Não informado'}
SEGMENTO: ${company?.segment || 'Não informado'}
PORTE: ${company?.size_team ? `${company.size_team} funcionários` : 'Não informado'}

Considerando o segmento e complexidade, retorne APENAS um JSON:
{
  "how_much": 15000
}

Use as diretrizes de budget por segmento do system prompt.`;

      console.log('Estimando budget apenas');

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: budgetPrompt }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract content and remove markdown code blocks if present
      let content = data.choices[0].message.content;
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      const result = JSON.parse(content);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `Crie um plano 5W2H detalhado para a seguinte iniciativa:

INICIATIVA: ${initiative.title}
DESCRIÇÃO: ${initiative.description || 'Não informada'}
OBJETIVO ESTRATÉGICO: ${objective?.title || 'Não informado'}
EMPRESA: ${company?.name || 'Não informada'}
SEGMENTO: ${company?.segment || 'Não informado'}
PORTE: ${company?.size_team ? `${company.size_team} funcionários` : 'Não informado'}

RETORNE UM JSON com esta estrutura EXATA:
{
  "what": "Descrição clara e específica do que será feito (2-3 frases)",
  "why": "Por que essa iniciativa é importante para o objetivo estratégico (2-3 frases explicando o vínculo)",
  "who": "Quem deve ser responsável (cargo/área específica baseado no porte, ex: 'Gerente de Marketing' ou 'Equipe Comercial')",
  "when": "Prazo sugerido em dias corridos baseado na complexidade (apenas o número, ex: 30, 60, 90, 120, 180)",
  "where": "Onde será executado (ex: 'Online - Redes Sociais', 'Presencial - Loja Física', 'Sistema CRM')",
  "how": "Como executar - passos principais (lista com 3-5 etapas práticas e sequenciais)",
  "how_much": "Estimativa REALISTA de investimento em reais baseada no segmento (apenas o número, ex: 5000, 15000, 50000)"
}

IMPORTANTE:
- Seja específico e prático
- When: considere a complexidade (simples=30-60, médio=60-120, complexo=120-180 dias)
- How much: use as diretrizes de budget por segmento acima - seja realista!
- Who: adapte ao porte da empresa (pequeno=equipes, médio=gerentes, grande=diretores)
- How: liste 3-5 passos claros e executáveis em ordem lógica
- Considere o segmento e contexto da empresa
- Foque em ações concretas, não abstratas`;

    console.log('Gerando 5W2H para iniciativa:', initiative.title);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace Lovable.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const fiveW2H = JSON.parse(content);

    console.log('5W2H gerado com sucesso');

    return new Response(
      JSON.stringify(fiveW2H),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar 5W2H:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar 5W2H' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
