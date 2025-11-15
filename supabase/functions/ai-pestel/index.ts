import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { companyId, swotData, companyInfo } = await req.json();

    // Fetch company data
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('Company fetch error:', companyError);
      throw new Error('Company not found');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Você é um consultor estratégico especializado em análise PESTEL.
Analise os fatores externos que podem impactar a empresa considerando:
- Setor: ${company.segment}
- Região: ${company.region || 'Brasil'}
- Modelo de negócio: ${company.model}
- Análise SWOT existente para contexto

Retorne APENAS um objeto JSON válido (sem markdown, sem explicações) no seguinte formato:
{
  "political": "Análise detalhada dos fatores políticos relevantes (2-3 parágrafos)",
  "economic": "Análise detalhada dos fatores econômicos relevantes (2-3 parágrafos)",
  "social": "Análise detalhada dos fatores sociais relevantes (2-3 parágrafos)",
  "technological": "Análise detalhada dos fatores tecnológicos relevantes (2-3 parágrafos)",
  "environmental": "Análise detalhada dos fatores ambientais relevantes (2-3 parágrafos)",
  "legal": "Análise detalhada dos fatores legais relevantes (2-3 parágrafos)",
  "key_impacts": ["Impacto mais crítico 1", "Impacto mais crítico 2", "Impacto mais crítico 3"],
  "opportunities": ["Oportunidade identificada 1", "Oportunidade identificada 2"],
  "threats": ["Ameaça identificada 1", "Ameaça identificada 2"]
}`;

    const userPrompt = `Empresa: ${company.name}
Setor: ${company.segment}
Região: ${company.region || 'Brasil'}
Modelo: ${company.model}

${swotData ? `Contexto SWOT:
Forças: ${swotData.strengths?.join(', ') || 'N/A'}
Fraquezas: ${swotData.weaknesses?.join(', ') || 'N/A'}
Oportunidades: ${swotData.opportunities?.join(', ') || 'N/A'}
Ameaças: ${swotData.threats?.join(', ') || 'N/A'}` : ''}

${companyInfo ? `Informações adicionais: ${companyInfo}` : ''}

Gere uma análise PESTEL completa e prática para esta empresa.`;

    console.log('Calling AI Gateway for PESTEL analysis...');
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
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Insufficient credits. Please add credits to your workspace.');
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received:', aiData);

    let pestelAnalysis;
    try {
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      pestelAnalysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Save to database
    const { data: existingAnalysis } = await supabaseClient
      .from('pestel_analysis')
      .select('id')
      .eq('company_id', companyId)
      .single();

    if (existingAnalysis) {
      const { error: updateError } = await supabaseClient
        .from('pestel_analysis')
        .update({
          political: pestelAnalysis.political,
          economic: pestelAnalysis.economic,
          social: pestelAnalysis.social,
          technological: pestelAnalysis.technological,
          environmental: pestelAnalysis.environmental,
          legal: pestelAnalysis.legal,
          key_impacts: pestelAnalysis.key_impacts || [],
          opportunities: pestelAnalysis.opportunities || [],
          threats: pestelAnalysis.threats || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAnalysis.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from('pestel_analysis')
        .insert({
          company_id: companyId,
          political: pestelAnalysis.political,
          economic: pestelAnalysis.economic,
          social: pestelAnalysis.social,
          technological: pestelAnalysis.technological,
          environmental: pestelAnalysis.environmental,
          legal: pestelAnalysis.legal,
          key_impacts: pestelAnalysis.key_impacts || [],
          opportunities: pestelAnalysis.opportunities || [],
          threats: pestelAnalysis.threats || [],
        });

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify(pestelAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-pestel function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});