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

    const body = await req.json();
    const { company, diagnostico } = body || {};
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Validação detalhada com mensagens específicas
    if (!company) {
      console.error('Missing company data in request body:', JSON.stringify(body));
      return new Response(
        JSON.stringify({ error: 'Dados da empresa não fornecidos. Por favor, complete as informações da empresa.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!diagnostico) {
      console.error('Missing diagnostico data in request body:', JSON.stringify(body));
      return new Response(
        JSON.stringify({ error: 'Diagnóstico não fornecido. Por favor, complete a análise SWOT primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validação de campos obrigatórios da empresa
    if (!company.name || !company.segment) {
      console.error('Missing required company fields:', company);
      return new Response(
        JSON.stringify({ error: 'Nome e segmento da empresa são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating OGSM for:', company.name, 'Segment:', company.segment);
    console.log('Diagnostico summary:', diagnostico?.leitura_executiva ? 'Present' : 'Missing');

    const systemPrompt = `Você é um estrategista corporativo de classe mundial.
Sua missão é criar um OGSM (Objective, Goals, Strategies, Measures) enxuto e executável para empresas brasileiras.

REGRAS:
- Escreva em português do Brasil, de forma clara e inspiradora
- Use números e verbos de ação
- Foco em execução nos próximos 12 meses
- Zero teoria, só prática`;

    const userPrompt = `Com base no diagnóstico abaixo, crie um OGSM completo para a empresa.

EMPRESA: ${company.name}
SEGMENTO: ${company.segment}
DESAFIO: ${company.main_challenge || 'Não especificado'}

DIAGNÓSTICO:
${diagnostico.leitura_executiva || 'Não disponível'}

SWOT RESUMIDO:
Forças: ${diagnostico.swot_resumido?.forcas?.join(', ') || 'Não especificado'}
Fraquezas: ${diagnostico.swot_resumido?.fraquezas?.join(', ') || 'Não especificado'}
Oportunidades: ${diagnostico.swot_resumido?.oportunidades?.join(', ') || 'Não especificado'}
Ameaças: ${diagnostico.swot_resumido?.ameacas?.join(', ') || 'Não especificado'}

PRODUZA UMA RESPOSTA JSON com esta estrutura EXATA:
{
  "objective": "UM objetivo estratégico central para os próximos 12 meses. Deve ser inspirador, claro e conectado ao desafio principal. Entre 15 e 25 palavras.",
  "goals": [
    {
      "titulo": "Meta de negócio 1",
      "descricao": "Descrição da meta",
      "mensuravel": "Como medir (ex: aumentar receita recorrente de R$X para R$Y)"
    }
  ],
  "strategies": [
    {
      "goal_id": 0,
      "titulo": "Estratégia 1",
      "descricao": "Como a empresa vai alcançar essa meta. Deve refletir o SWOT/PESTEL"
    }
  ],
  "measures": [
    {
      "strategy_id": 0,
      "nome": "Nome da métrica",
      "o_que_medir": "Descrição do que será medido para saber se a estratégia está funcionando"
    }
  ]
}

IMPORTANTE:
- Gere de 3 a 5 goals mensuráveis
- Gere de 3 a 6 strategies que conectam aos goals
- Para cada strategy, defina 1 ou 2 measures
- Use goal_id e strategy_id como índices (0, 1, 2...) para criar relacionamentos
- Se a empresa quer crescer, priorize metas de aquisição, conversão, receita
- Se a empresa quer eficiência, priorize metas de produtividade, custo, SLA`;

    // Implementação de retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let lastError;

    while (retryCount < maxRetries) {
      try {
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
          const errorText = await response.text();
          console.error('AI Gateway error:', response.status, errorText);
          
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em instantes.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos no workspace Lovable.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
          console.error('Invalid AI response structure:', data);
          throw new Error('Resposta da IA inválida');
        }

        const result = JSON.parse(data.choices[0].message.content);

        // Validação da estrutura do resultado
        if (!result.objective || !result.goals || !result.strategies || !result.measures) {
          console.error('Missing required OGSM fields in AI response:', result);
          throw new Error('Resposta da IA incompleta');
        }

        console.log('OGSM generated successfully');

        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        lastError = error;
        retryCount++;
        console.error(`Attempt ${retryCount} failed:`, error);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    // Se todas as tentativas falharem
    throw lastError;

  } catch (error) {
    console.error('Erro ao gerar OGSM:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar OGSM';
    const statusCode = error instanceof Error && error.message.includes('não fornecido') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
