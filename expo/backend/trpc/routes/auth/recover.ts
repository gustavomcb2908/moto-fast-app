import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { supabaseServer } from '../../../lib/supabase';

export const recoverProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
  }))
  .mutation(async ({ input }) => {
    console.log('🔑 Password recovery request (Supabase):', input.email);

    const redirectTo = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT || process.env.EXPO_PUBLIC_FRONTEND_URL;
    const { error } = await supabaseServer.auth.resetPasswordForEmail(input.email, {
      redirectTo: redirectTo ? `${redirectTo}/reset-password` : undefined,
    });
    if (error) {
      console.error('❌ Supabase resetPasswordForEmail error:', error.message);
    }

    return {
      success: true,
      message: 'Se existe uma conta com esse e-mail, enviámos instruções para redefinir a senha.',
    };
  });
