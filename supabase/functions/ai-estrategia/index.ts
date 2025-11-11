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

    const { company, analysis, focus } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating strategic objectives for:', company.name, 'Focus:', focus);

    const systemPrompt = `Você vai atuar como um Chief Strategy Officer. Vou te enviar:
- contexto da empresa
- leitura executiva gerada anteriormente
- foco prioritário escolhido pelo usuário (crescimento, eficiência, produto, pessoas, ou AI/automação)

Gere de 3 a 5 Objetivos Estratégicos para os próximos 12 meses.
Para cada objetivo, gere:
- um título curto e direto
- uma descrição de até 3 linhas
- indique o horizonte (H1 = agora e caixa, H2 = expansão, H3 = inovação)
- indique a perspectiva BSC mais adequada (financeira, clientes, processos, aprendizado)
- escreva de 3 a 7 iniciativas bem específicas, com verbo de ação no começo (ex.: "Criar…", "Implantar…", "Mapear…", "Automatizar…").

Os objetivos devem ser executáveis por uma empresa brasileira de pequeno a médio porte, mas com ambição de crescer.
Inclua pelo menos 1 iniciativa de digitalização/automação/IA quando fizer sentido.

Retorne em JSON com a estrutura:
{
  "objetivos": [
    {
      "titulo": "Título do objetivo",
      "descricao": "Descrição curta",
      "horizonte": "H1" ou "H2" ou "H3",
      "perspectiva": "financeira" ou "clientes" ou "processos" ou "aprendizado",
      "prioridade": 1 a 5,
      "iniciativas": [
        {
          "titulo": "Título da iniciativa",
          "descricao": "Descrição da iniciativa",
          "impacto": 1 a 5,
          "esforco": 1 a 5
        }
      ]
    }
  ]
}`;

    const userPrompt = `Empresa: ${company.name}
Segmento: ${company.segment}
Modelo: ${company.model}
Tamanho do time: ${company.size_team} pessoas

Leitura Executiva: ${analysis}

Foco Prioritário: ${focus}

Gere os objetivos estratégicos e iniciativas.`;

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

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract content and remove markdown code blocks if present
    let content = data.choices[0].message.content;
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const result = JSON.parse(content);

    console.log('Strategy generated successfully');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-estrategia:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar estratégia' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
