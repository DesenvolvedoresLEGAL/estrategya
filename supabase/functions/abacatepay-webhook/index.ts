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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Use service role for webhook processing
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const webhookData = await req.json();
    
    console.log('Received AbacatePay webhook:', JSON.stringify(webhookData, null, 2));

    // AbacatePay webhook structure
    const { kind, data } = webhookData;

    if (!kind || !data) {
      console.error('Invalid webhook payload');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process different event types
    switch (kind) {
      case 'billing.paid':
      case 'billing.completed': {
        console.log(`Processing payment confirmation for billing ${data.id}`);
        
        const metadata = data.metadata || {};
        const { userId, companyId, planId, planTier } = metadata;

        if (!userId || !companyId || !planId) {
          console.error('Missing metadata in webhook:', metadata);
          return new Response(
            JSON.stringify({ error: 'Missing required metadata' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if subscription already exists
        const { data: existingSubscription } = await supabase
          .from('company_subscriptions')
          .select('*')
          .eq('company_id', companyId)
          .single();

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

        if (existingSubscription) {
          // Update existing subscription
          const { error: updateError } = await supabase
            .from('company_subscriptions')
            .update({
              plan_id: planId,
              status: 'active',
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('company_id', companyId);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
            throw updateError;
          }

          console.log(`Subscription updated for company ${companyId}`);
        } else {
          // Create new subscription
          const { error: createError } = await supabase
            .from('company_subscriptions')
            .insert({
              company_id: companyId,
              plan_id: planId,
              status: 'active',
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString()
            });

          if (createError) {
            console.error('Error creating subscription:', createError);
            throw createError;
          }

          console.log(`Subscription created for company ${companyId}`);
        }

        // Log payment confirmation
        await supabase.from('activity_log').insert({
          company_id: companyId,
          user_id: userId,
          action_type: 'payment_confirmed',
          entity_type: 'subscription',
          entity_id: planId,
          details: {
            billing_id: data.id,
            plan_tier: planTier,
            amount: data.amount,
            status: data.status,
            payment_method: data.method || 'unknown'
          }
        });

        break;
      }

      case 'billing.cancelled':
      case 'billing.refunded': {
        console.log(`Processing cancellation/refund for billing ${data.id}`);
        
        const metadata = data.metadata || {};
        const { userId, companyId, planId } = metadata;

        if (companyId) {
          // Update subscription status to cancelled
          await supabase
            .from('company_subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString()
            })
            .eq('company_id', companyId);

          // Log cancellation
          await supabase.from('activity_log').insert({
            company_id: companyId,
            user_id: userId || '',
            action_type: 'payment_cancelled',
            entity_type: 'subscription',
            entity_id: planId || '',
            details: {
              billing_id: data.id,
              status: data.status,
              reason: kind
            }
          });

          console.log(`Subscription cancelled for company ${companyId}`);
        }

        break;
      }

      default:
        console.log(`Unhandled webhook event: ${kind}`);
    }

    return new Response(
      JSON.stringify({ success: true, processed: kind }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing AbacatePay webhook:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Erro ao processar webhook' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
