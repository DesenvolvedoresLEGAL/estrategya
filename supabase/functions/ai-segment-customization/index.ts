import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    // Verify the user token first
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, segment, company_context } = await req.json();
    console.log(`Segment customization request - Action: ${action}, Segment: ${segment}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'generate_questions') {
      // Get questions template for the segment
      const { data: template, error } = await supabase
        .from('segment_templates')
        .select('template_data')
        .eq('segment', segment)
        .eq('template_type', 'questions')
        .maybeSingle();

      if (error) {
        console.error('Error fetching questions template:', error);
        return new Response(JSON.stringify({ questions: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const questions = template?.template_data?.questions || [];
      
      console.log(`Returning ${questions.length} questions for segment ${segment}`);
      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_kpis') {
      // Get KPIs suggestions for the segment
      const { data: template, error } = await supabase
        .from('segment_templates')
        .select('template_data')
        .eq('segment', segment)
        .eq('template_type', 'kpis')
        .maybeSingle();

      if (error) {
        console.error('Error fetching KPIs template:', error);
        return new Response(JSON.stringify({ kpis: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const kpis = template?.template_data?.suggested_kpis || [];
      
      console.log(`Returning ${kpis.length} KPIs for segment ${segment}`);
      return new Response(JSON.stringify({ kpis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'analyze_pestel') {
      // Generate PESTEL analysis using AI for specific segments
      const pestelSegments = ['Eventos', 'Telecomunicações', 'Indústria'];
      
      if (!pestelSegments.includes(segment)) {
        return new Response(JSON.stringify({ 
          pestel: null,
          message: 'PESTEL analysis not applicable for this segment' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      const systemPrompt = `Você é um especialista em análise PESTEL para empresas. Retorne APENAS um JSON válido sem markdown ou explicações adicionais.`;

      const userPrompt = `Analise os fatores PESTEL para esta empresa do segmento ${segment}:

Contexto da Empresa:
- Nome: ${company_context.name}
- Segmento: ${segment}
- Modelo: ${company_context.model}
- Região: ${company_context.region || 'Não especificada'}
- Desafio Principal: ${company_context.main_challenge || 'Não especificado'}

Gere uma análise PESTEL considerando o contexto brasileiro e específico para o segmento ${segment}.

Retorne no formato JSON:
{
  "politico": "Análise do fator político (1-2 frases)",
  "economico": "Análise do fator econômico (1-2 frases)",
  "social": "Análise do fator social (1-2 frases)",
  "tecnologico": "Análise do fator tecnológico (1-2 frases)",
  "ambiental": "Análise do fator ambiental (1-2 frases)",
  "legal": "Análise do fator legal (1-2 frases)"
}`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (aiResponse.status === 402) {
          throw new Error('Insufficient credits. Please add credits to your workspace.');
        }
        const errorText = await aiResponse.text();
        throw new Error(`AI Gateway error: ${errorText}`);
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices[0].message.content;
      
      // Extract JSON from response
      let pestelData;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          pestelData = JSON.parse(jsonMatch[0]);
        } else {
          pestelData = JSON.parse(content);
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError, 'Content:', content);
        throw new Error('Invalid AI response format');
      }

      console.log('PESTEL analysis generated successfully');
      return new Response(JSON.stringify({ pestel: pestelData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-segment-customization:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
