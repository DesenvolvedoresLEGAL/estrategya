import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  companyId: string;
  email: string;
  role: string;
  companyName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorização necessária');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { companyId, email, role, companyName }: InviteRequest = await req.json();

    console.log('Enviando convite para:', email, 'role:', role);

    // Verificar se o usuário tem permissão para convidar
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single();

    if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
      throw new Error('Sem permissão para convidar membros');
    }

    // Verificar se já existe convite pendente
    const { data: existingInvite } = await supabase
      .from('team_invites')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', email)
      .eq('accepted', false)
      .single();

    if (existingInvite) {
      throw new Error('Já existe um convite pendente para este e-mail');
    }

    // Criar convite
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        company_id: companyId,
        email: email,
        role: role,
        invited_by: user.id
      })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    console.log('Convite criado:', invite.id);

    // Registrar atividade
    await supabase.from('activity_log').insert({
      company_id: companyId,
      user_id: user.id,
      action_type: 'invited',
      entity_type: 'team_member',
      entity_id: invite.id,
      details: {
        email: email,
        role: role
      }
    });

    // Link de aceitação
    const inviteLink = `${supabaseUrl.replace('.supabase.co', '')}/aceitar-convite?token=${invite.invite_token}`;

    // TODO: Integrar com Resend para enviar e-mail
    // Por enquanto, retornar o link de convite
    const emailContent = `
      Você foi convidado para participar da equipe ${companyName}!
      
      Seu cargo será: ${role}
      
      Clique no link abaixo para aceitar o convite:
      ${inviteLink}
      
      Este convite expira em 7 dias.
    `;

    console.log('Link de convite:', inviteLink);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inviteId: invite.id,
        inviteLink: inviteLink,
        message: 'Convite criado com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao enviar convite:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
