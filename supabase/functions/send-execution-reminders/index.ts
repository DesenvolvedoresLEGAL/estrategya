import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderData {
  id: string;
  company_id: string;
  reminder_type: string;
  recipient_ids: string[];
  metadata: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔔 Verificando lembretes pendentes...");

    // Buscar lembretes pendentes que devem ser enviados
    const now = new Date();
    const { data: reminders, error: remindersError } = await supabase
      .from("execution_reminders")
      .select("*")
      .eq("sent", false)
      .lte("scheduled_for", now.toISOString())
      .limit(50);

    if (remindersError) {
      console.error("Erro ao buscar lembretes:", remindersError);
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      console.log("✅ Nenhum lembrete pendente");
      return new Response(JSON.stringify({ message: "Nenhum lembrete pendente", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📧 Processando ${reminders.length} lembrete(s)...`);

    const results = [];

    for (const reminder of reminders as ReminderData[]) {
      try {
        console.log(`Processando lembrete ${reminder.id} - Tipo: ${reminder.reminder_type}`);

        // Buscar informações da empresa
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("name, owner_user_id")
          .eq("id", reminder.company_id)
          .single();

        if (companyError || !company) {
          console.error(`Erro ao buscar empresa ${reminder.company_id}:`, companyError);
          continue;
        }

        // Gerar conteúdo do lembrete baseado no tipo
        const reminderContent = generateReminderContent(reminder, company.name);

        // Log do lembrete (aqui você pode integrar com serviço de e-mail)
        console.log(`📨 Lembrete para enviar:`);
        console.log(`  - Empresa: ${company.name}`);
        console.log(`  - Tipo: ${reminder.reminder_type}`);
        console.log(`  - Destinatários: ${reminder.recipient_ids.length}`);
        console.log(`  - Assunto: ${reminderContent.subject}`);

        // TODO: Integrar com Resend ou outro serviço de e-mail
        // Exemplo:
        // await sendEmail({
        //   to: reminder.recipient_ids,
        //   subject: reminderContent.subject,
        //   html: reminderContent.html
        // });

        // Marcar lembrete como enviado
        const { error: updateError } = await supabase
          .from("execution_reminders")
          .update({
            sent: true,
            sent_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        if (updateError) {
          console.error(`Erro ao atualizar lembrete ${reminder.id}:`, updateError);
        }

        results.push({
          reminder_id: reminder.id,
          status: "sent",
          type: reminder.reminder_type,
        });
      } catch (error) {
        console.error(`Erro ao processar lembrete ${reminder.id}:`, error);
        results.push({
          reminder_id: reminder.id,
          status: "error",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    console.log(`✅ Processamento concluído: ${results.filter((r) => r.status === "sent").length} enviados`);

    return new Response(
      JSON.stringify({
        message: "Lembretes processados",
        total: reminders.length,
        sent: results.filter((r) => r.status === "sent").length,
        errors: results.filter((r) => r.status === "error").length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("❌ Erro geral:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateReminderContent(reminder: ReminderData, companyName: string) {
  switch (reminder.reminder_type) {
    case "weekly_checkin":
      return {
        subject: `⏰ Lembrete: Check-in Semanal WBR - ${companyName}`,
        html: `
          <h2>Hora do Check-in Semanal! 📊</h2>
          <p>Olá!</p>
          <p>É hora de realizar o check-in semanal do WBR (Weekly Business Review) para <strong>${companyName}</strong>.</p>
          <h3>O que fazer:</h3>
          <ul>
            <li>✅ Revisar o progresso do MCI (Meta Crucialmente Importante)</li>
            <li>✅ Atualizar as medidas de direção</li>
            <li>✅ Reportar ações concluídas</li>
            <li>✅ Identificar bloqueios</li>
            <li>✅ Definir compromissos para próxima semana</li>
          </ul>
          <p><a href="${supabaseUrl.replace("/functions/v1/", "")}/planejamento" style="display: inline-block; padding: 10px 20px; background: #0066FF; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Realizar Check-in Agora</a></p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Este é um lembrete automático do sistema Strategic Planner OS.</p>
        `,
      };

    case "action_overdue":
      return {
        subject: `⚠️ Ação Atrasada - ${companyName}`,
        html: `
          <h2>Atenção: Ação Atrasada ⚠️</h2>
          <p>Olá!</p>
          <p>Uma ação do seu plano de execução está atrasada:</p>
          <div style="background: #FFF3CD; border-left: 4px solid #FF9800; padding: 15px; margin: 15px 0;">
            <strong>Ação:</strong> ${reminder.metadata?.action_title || "N/A"}<br>
            <strong>Responsável:</strong> ${reminder.metadata?.owner || "N/A"}<br>
            <strong>Prazo:</strong> ${reminder.metadata?.deadline || "N/A"}
          </div>
          <p>Por favor, atualize o status ou redefina o prazo.</p>
          <p><a href="${supabaseUrl.replace("/functions/v1/", "")}/planejamento" style="display: inline-block; padding: 10px 20px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Atualizar Ação</a></p>
        `,
      };

    case "metric_update":
      return {
        subject: `📈 Lembrete: Atualizar Métricas - ${companyName}`,
        html: `
          <h2>Hora de Atualizar as Métricas! 📈</h2>
          <p>Olá!</p>
          <p>É hora de atualizar as métricas do placar visível para <strong>${companyName}</strong>.</p>
          <h3>Métricas para atualizar:</h3>
          <ul>
            <li>Medidas de Direção (Lead Measures)</li>
            <li>Medidas de Resultado (Lag Measures)</li>
          </ul>
          <p>Manter o placar atualizado é fundamental para a execução eficaz da estratégia.</p>
          <p><a href="${supabaseUrl.replace("/functions/v1/", "")}/planejamento" style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Atualizar Métricas</a></p>
        `,
      };

    default:
      return {
        subject: `Lembrete - ${companyName}`,
        html: `
          <p>Você tem um lembrete pendente no Estrategya Planner OS.</p>
          <p><a href="${supabaseUrl.replace("/functions/v1/", "")}/planejamento">Acessar Sistema</a></p>
        `,
      };
  }
}
