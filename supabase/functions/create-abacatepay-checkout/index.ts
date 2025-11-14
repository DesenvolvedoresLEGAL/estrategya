import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Parse JWT to get user ID and email
    const token = authHeader.replace('Bearer ', '');
    const parseJwt = (t: string) => {
      const base64 = t.split('.')[1];
      const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    };

    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const payload = parseJwt(token);
      userId = payload?.sub ?? null;
      userEmail = payload?.email ?? null;
    } catch (e) {
      console.error('JWT parse error:', e);
      return new Response(
        JSON.stringify({ error: 'Token de autenticação inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação inválido ou email não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { planTier, companyId } = await req.json();

    if (!planTier || !companyId) {
      return new Response(
        JSON.stringify({ error: 'planTier e companyId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating AbacatePay checkout for user ${userId}, plan ${planTier}, company ${companyId}`);

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('tier', planTier)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get company info
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name, cnpj, whatsapp_phone')
      .eq('id', companyId)
      .single();

    // Create AbacatePay billing
    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!abacatePayApiKey) {
      console.error('ABACATEPAY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Configuração de pagamento não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const priceInCents = Math.round(parseFloat(plan.price_monthly) * 100);
    
    const billingData = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: `plan-${plan.tier}-${Date.now()}`,
          name: `Plano ${plan.name}`,
          description: `Assinatura mensal do plano ${plan.name}`,
          quantity: 1,
          price: priceInCents
        }
      ],
      returnUrl: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/planejamento`,
      completionUrl: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/planejamento?payment=success`,
      customer: {
        email: userEmail,
        name: company?.name || 'Cliente',
        cellphone: company?.whatsapp_phone || '',
        taxId: company?.cnpj?.replace(/\D/g, '') || ''
      },
      metadata: {
        userId,
        companyId,
        planTier,
        planId: plan.id
      }
    };

    console.log('Creating AbacatePay billing:', JSON.stringify(billingData, null, 2));

    const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${abacatePayApiKey}`
      },
      body: JSON.stringify(billingData)
    });

    const responseText = await abacateResponse.text();
    console.log('AbacatePay response:', responseText);

    if (!abacateResponse.ok) {
      console.error('AbacatePay API error:', responseText);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar cobrança no AbacatePay',
          details: responseText 
        }),
        { status: abacateResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const abacateData = JSON.parse(responseText);

    if (abacateData.error) {
      console.error('AbacatePay returned error:', abacateData.error);
      return new Response(
        JSON.stringify({ error: abacateData.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store billing info for tracking
    await supabaseClient.from('activity_log').insert({
      company_id: companyId,
      user_id: userId,
      action_type: 'checkout_created',
      entity_type: 'payment',
      entity_id: abacateData.data.id,
      details: {
        billing_id: abacateData.data.id,
        plan_tier: planTier,
        amount: priceInCents,
        status: abacateData.data.status
      }
    });

    console.log('Checkout created successfully:', abacateData.data.id);

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: abacateData.data.url,
        billingId: abacateData.data.id,
        amount: abacateData.data.amount,
        status: abacateData.data.status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating AbacatePay checkout:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Erro ao criar checkout' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
