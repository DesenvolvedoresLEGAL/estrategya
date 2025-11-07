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

    const { companyId, industryInfo } = await req.json();

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

    const systemPrompt = `Você é um consultor estratégico especializado em análise de competitividade usando o framework das 5 Forças de Porter.
Analise a competitividade do setor considerando:
- Setor: ${company.segment}
- Modelo de negócio: ${company.model}
- Região: ${company.region || 'Brasil'}

Para cada força, atribua uma pontuação de 1 (baixa intensidade) a 5 (alta intensidade).

Retorne APENAS um objeto JSON válido (sem markdown, sem explicações) no seguinte formato:
{
  "rivalry_score": 4,
  "rivalry_analysis": "Análise detalhada da rivalidade entre concorrentes (2-3 parágrafos)",
  "new_entrants_score": 3,
  "new_entrants_analysis": "Análise detalhada da ameaça de novos entrantes (2-3 parágrafos)",
  "supplier_power_score": 3,
  "supplier_power_analysis": "Análise detalhada do poder de barganha dos fornecedores (2-3 parágrafos)",
  "buyer_power_score": 4,
  "buyer_power_analysis": "Análise detalhada do poder de barganha dos clientes (2-3 parágrafos)",
  "substitutes_score": 2,
  "substitutes_analysis": "Análise detalhada da ameaça de produtos substitutos (2-3 parágrafos)",
  "overall_competitiveness": "Alta/Média/Baixa - explicação geral",
  "recommendations": ["Recomendação estratégica 1", "Recomendação estratégica 2", "Recomendação estratégica 3"],
  "competitive_advantages": ["Vantagem competitiva identificada 1", "Vantagem competitiva identificada 2"],
  "threats_to_monitor": ["Ameaça competitiva 1", "Ameaça competitiva 2"]
}`;

    const userPrompt = `Empresa: ${company.name}
Setor: ${company.segment}
Modelo: ${company.model}
Região: ${company.region || 'Brasil'}

${industryInfo ? `Informações do setor: ${industryInfo}` : ''}

Gere uma análise completa das 5 Forças de Porter para esta empresa.`;

    console.log('Calling AI Gateway for Porter analysis...');
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

    let porterAnalysis;
    try {
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      porterAnalysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Save to database
    const { data: existingAnalysis } = await supabaseClient
      .from('porter_analysis')
      .select('id')
      .eq('company_id', companyId)
      .single();

    if (existingAnalysis) {
      const { error: updateError } = await supabaseClient
        .from('porter_analysis')
        .update({
          rivalry_score: porterAnalysis.rivalry_score,
          rivalry_analysis: porterAnalysis.rivalry_analysis,
          new_entrants_score: porterAnalysis.new_entrants_score,
          new_entrants_analysis: porterAnalysis.new_entrants_analysis,
          supplier_power_score: porterAnalysis.supplier_power_score,
          supplier_power_analysis: porterAnalysis.supplier_power_analysis,
          buyer_power_score: porterAnalysis.buyer_power_score,
          buyer_power_analysis: porterAnalysis.buyer_power_analysis,
          substitutes_score: porterAnalysis.substitutes_score,
          substitutes_analysis: porterAnalysis.substitutes_analysis,
          overall_competitiveness: porterAnalysis.overall_competitiveness,
          recommendations: porterAnalysis.recommendations?.join('\n\n'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAnalysis.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from('porter_analysis')
        .insert({
          company_id: companyId,
          rivalry_score: porterAnalysis.rivalry_score,
          rivalry_analysis: porterAnalysis.rivalry_analysis,
          new_entrants_score: porterAnalysis.new_entrants_score,
          new_entrants_analysis: porterAnalysis.new_entrants_analysis,
          supplier_power_score: porterAnalysis.supplier_power_score,
          supplier_power_analysis: porterAnalysis.supplier_power_analysis,
          buyer_power_score: porterAnalysis.buyer_power_score,
          buyer_power_analysis: porterAnalysis.buyer_power_analysis,
          substitutes_score: porterAnalysis.substitutes_score,
          substitutes_analysis: porterAnalysis.substitutes_analysis,
          overall_competitiveness: porterAnalysis.overall_competitiveness,
          recommendations: porterAnalysis.recommendations?.join('\n\n'),
        });

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify(porterAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-porter function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});