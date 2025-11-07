import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { supabaseServer } from '../../../lib/supabase';

export const resendVerificationProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
  }))
  .mutation(async ({ input }) => {
    console.log('📧 Resend verification request (Supabase):', input.email);

    const { error } = await supabaseServer.auth.resend({ type: 'signup', email: input.email });
    if (error) {
      console.error('❌ Resend error:', error.message);
    }

    return {
      success: true,
      message: 'Se existe uma conta com esse e-mail, o link de verificação foi reenviado.',
    };
  });
