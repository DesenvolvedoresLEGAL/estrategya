import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuickWin {
  titulo: string;
  justificativa: string;
}

interface Adjustment {
  objetivo_id: string;
  sugestao: string;
  razao: string;
}

interface NewInitiative {
  titulo: string;
  descricao: string;
  impacto_esperado: string;
}

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

    const { company_id, context, performance } = await req.json();
    
    console.log(`Generating smart suggestions for company: ${company_id}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um consultor estratégico especializado em otimização de resultados e geração de ideias práticas.

Sua tarefa é sugerir melhorias baseadas no contexto atual e performance da empresa.

REGRAS:
1. Seja ULTRA-ESPECÍFICO - nada de conselhos genéricos
2. Quick Wins devem ser ações de CURTO PRAZO (7-30 dias)
3. Ajustes devem ser REALISTAS e implementáveis
4. Novas iniciativas devem ter ALTO IMPACTO
5. Use dados do contexto para fundamentar sugestões

CATEGORIAS:

**QUICK WINS**: Ações rápidas para ganhos imediatos
- Implementáveis em menos de 30 dias
- Baixo esforço, impacto visível
- Focadas em otimização do que já existe

**AJUSTES**: Modificações em objetivos ou iniciativas existentes
- Baseados em performance atual
- Correções de curso necessárias
- Realocação de prioridades

**NOVAS INICIATIVAS**: Projetos novos de alto impacto
- Preencher gaps estratégicos
- Aproveitar oportunidades não exploradas
- Inovações para acelerar resultados

Retorne APENAS um JSON válido no formato:
{
  "quick_wins": [
    {
      "titulo": "Ação específica",
      "justificativa": "Por que funciona e impacto esperado"
    }
  ],
  "adjustments": [
    {
      "objetivo_id": "uuid do objetivo",
      "sugestao": "O que ajustar",
      "razao": "Por que ajustar"
    }
  ],
  "new_initiatives": [
    {
      "titulo": "Nome da iniciativa",
      "descricao": "Descrição detalhada",
      "impacto_esperado": "Resultado esperado"
    }
  ]
}`;

    const userPrompt = `Com base no contexto e performance abaixo, sugira melhorias:

CONTEXTO DA EMPRESA:
${JSON.stringify(context, null, 2)}

PERFORMANCE ATUAL:
${JSON.stringify(performance, null, 2)}

Gere:
1. 3-5 Quick Wins (ações rápidas)
2. 2-4 Ajustes (modificações em objetivos/iniciativas existentes)
3. 2-3 Novas Iniciativas (projetos de alto impacto)

Seja criativo mas realista. Foque em ações que fazem diferença real.`;

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
        temperature: 0.8,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract content and remove markdown code blocks if present
    let content = data.choices[0].message.content;
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const suggestions = JSON.parse(content);

    console.log('Smart suggestions generated successfully');

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-smart-suggestions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
