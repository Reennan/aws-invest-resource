import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  email: string;
  action?: 'request' | 'reset';
  token?: string;
  newPassword?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const { email, action = 'request', token, newPassword }: ResetPasswordRequest = await req.json();

    if (action === 'request') {
      // Check if user exists by querying the database instead
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('auth_user_id, email')
        .eq('email', email)
        .single();
      
      if (profileError || !profileData) {
        console.log('User not found:', email);
        // Return success even if user doesn't exist for security
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Generate reset token
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Store token in database
      const { error: tokenError } = await supabase
        .from('password_reset_tokens')
        .insert({
          email,
          token: resetToken,
          expires_at: expiresAt.toISOString(),
        });

      if (tokenError) {
        console.error('Error storing token:', tokenError);
        throw new Error('Failed to generate reset token');
      }

      // Send reset email
      const resetUrl = `${req.headers.get('origin')}/auth?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      const emailResponse = await resend.emails.send({
        from: "Sistema <onboarding@resend.dev>",
        to: [email],
        subject: "Reset de Senha - Sistema de Monitoramento AWS",
        html: `
          <h2>Solicitação de Reset de Senha</h2>
          <p>Você solicitou um reset de senha para sua conta.</p>
          <p>Clique no link abaixo para definir uma nova senha:</p>
          <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Redefinir Senha
          </a>
          <p>Este link expira em 30 minutos.</p>
          <p>Se você não solicitou este reset, ignore este email.</p>
        `,
      });

      console.log('Reset email sent:', emailResponse);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } else if (action === 'reset') {
      if (!token || !newPassword) {
        return new Response(JSON.stringify({ error: 'Token and new password required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Validate token
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Update user password by getting user ID from profile
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('auth_user_id, email')
        .eq('email', email)
        .single();
      
      if (profileError || !profileData) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        profileData.auth_user_id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update password' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Mark token as used
      await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('token', token);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in reset-password function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);