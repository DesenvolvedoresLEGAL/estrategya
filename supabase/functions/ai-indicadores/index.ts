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
    const { objectives } = body || {};
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Validação detalhada
    if (!objectives || !Array.isArray(objectives) || objectives.length === 0) {
      console.error('Invalid objectives data:', objectives);
      return new Response(
        JSON.stringify({ error: 'Lista de objetivos não fornecida ou vazia. Por favor, crie objetivos estratégicos primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating metrics for ${objectives.length} objectives`);

    const systemPrompt = `Você receberá uma lista de Objetivos Estratégicos de uma empresa.
Para cada objetivo, sugira de 2 a 4 métricas/KRs que permitam medir o progresso.

Sempre que o objetivo for de crescimento, sugira métricas como: Receita mensal, Nº de clientes ativos, Ticket médio, CAC, Taxa de recompra.
Sempre que o objetivo for de eficiência, sugira métricas como: Tempo de atendimento, SLA, Nº de retrabalhos, Custo operacional.
Sempre que o objetivo envolver cliente, sugira métricas como: NPS, CSAT, Tempo de ativação, Nº de chamados.

Devolva a resposta estruturada por objetivo em JSON:
{
  "metricas_por_objetivo": {
    "objetivo_id_ou_titulo": [
      {
        "nome": "Nome da métrica",
        "meta": "Valor alvo sugerido",
        "periodo": "mensal" ou "trimestral" ou "anual"
      }
    ]
  }
}

Linguagem simples. Não explique o que é KPI, apenas liste.`;

    const objectivesText = objectives.map((obj: any, idx: number) => 
      `${idx + 1}. ${obj.titulo} (${obj.perspectiva})`
    ).join('\n');

    const userPrompt = `Objetivos Estratégicos:
${objectivesText}

Gere as métricas para cada objetivo.`;

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

        // Extract content and remove markdown code blocks if present
        let content = data.choices[0].message.content;
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        const result = JSON.parse(content);

        // Validação da estrutura do resultado
        if (!result.metricas_por_objetivo) {
          console.error('Missing metricas_por_objetivo in AI response:', result);
          throw new Error('Resposta da IA incompleta');
        }

        console.log('Metrics generated successfully');

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
    console.error('Error in ai-indicadores:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar indicadores';
    const statusCode = error instanceof Error && error.message.includes('não fornecida') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
