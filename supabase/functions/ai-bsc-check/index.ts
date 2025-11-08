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

    const { okrs, strategies } = await req.json();
    
    if (!okrs || !strategies) {
      throw new Error('Dados incompletos');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em Balanced Scorecard (BSC).
Sua missão é verificar se um plano estratégico cobre as 4 perspectivas do BSC:
1. Finanças
2. Clientes
3. Processos Internos
4. Aprendizado e Crescimento

Se alguma perspectiva estiver vazia, você deve sugerir 1 iniciativa ou KR para cobrir essa lacuna.`;

    const okrsText = okrs.okrs?.map((okr: any) => 
      `Objective: ${okr.objective}\nKey Results: ${okr.key_results?.map((kr: any) => kr.kr).join(', ')}`
    ).join('\n\n');

    const strategiesText = strategies?.map((s: any) => 
      `${s.titulo}: ${s.descricao}`
    ).join('\n');

    const userPrompt = `Analise se os OKRs e Estratégias abaixo cobrem as 4 perspectivas do Balanced Scorecard.

OKRs:
${okrsText}

ESTRATÉGIAS:
${strategiesText}

PRODUZA UMA RESPOSTA JSON com esta estrutura EXATA:
{
  "financas": {
    "coberto": true ou false,
    "itens": ["lista dos OKRs/Estratégias que cobrem essa perspectiva"],
    "sugestao": "Se não estiver coberto, sugira 1 KR ou iniciativa específica. Se estiver coberto, retorne null"
  },
  "clientes": {
    "coberto": true ou false,
    "itens": ["lista"],
    "sugestao": "Sugestão ou null"
  },
  "processos": {
    "coberto": true ou false,
    "itens": ["lista"],
    "sugestao": "Sugestão ou null"
  },
  "aprendizado": {
    "coberto": true ou false,
    "itens": ["lista"],
    "sugestao": "Sugestão ou null"
  },
  "explicacao": "Texto de 3 a 5 linhas explicando por que o equilíbrio entre as 4 perspectivas é importante para esta empresa"
}

PERSPECTIVAS DO BSC:
- Finanças: receita, lucro, margens, custos, investimentos
- Clientes: satisfação, NPS, retenção, aquisição, experiência
- Processos Internos: eficiência operacional, qualidade, tempo de entrega, automação
- Aprendizado e Crescimento: capacitação, cultura, tecnologia, inovação`;

    console.log('Verificando equilíbrio BSC...');

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
    const bscCheck = JSON.parse(content);

    console.log('Verificação BSC concluída');

    return new Response(
      JSON.stringify(bscCheck),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao verificar BSC:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao verificar BSC' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
