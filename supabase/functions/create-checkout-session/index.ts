import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  planId: string;
  billingPeriod?: "monthly" | "annual";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header first
    const authHeader = req.headers.get("Authorization")!;
    
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client with auth token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader }
        },
        auth: {
          persistSession: false,
        },
      }
    );

    // Get authenticated user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { planId, billingPeriod = "monthly" }: CheckoutRequest = await req.json();

    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      throw new Error("Plan not found");
    }

    // Get user's company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_user_id", user.id)
      .single();

    if (companyError || !company) {
      throw new Error("Company not found");
    }

    console.log("Creating checkout session for:", {
      userId: user.id,
      companyId: company.id,
      planId,
      billingPeriod,
    });

    // IMPORTANT: For production, you would integrate with Stripe here
    // This is a placeholder that demonstrates the flow
    
    // Example Stripe integration (requires STRIPE_SECRET_KEY):
    /*
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const price = billingPeriod === "annual" ? plan.price_annual : plan.price_monthly;
    
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: plan.name,
              description: `Plano ${plan.name} - ${billingPeriod === "annual" ? "Anual" : "Mensal"}`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
            recurring: {
              interval: billingPeriod === "annual" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/planejamento`,
      metadata: {
        companyId: company.id,
        planId,
        userId: user.id,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    */

    // For now, return a mock response
    // In production, replace this with actual Stripe integration
    return new Response(
      JSON.stringify({ 
        message: "Stripe integration required. Please configure STRIPE_SECRET_KEY.",
        mockCheckoutUrl: `${req.headers.get("origin")}/dashboard`,
        planDetails: {
          name: plan.name,
          price: billingPeriod === "annual" ? plan.price_annual : plan.price_monthly,
          billingPeriod,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
