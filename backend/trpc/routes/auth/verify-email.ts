import { z } from 'zod';
import { publicProcedure } from '../../create-context';

export const verifyEmailProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    token: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('📧 Email verification callback received (Supabase handles verification links):', input.email);
    return {
      success: true,
      message: 'Verificação gerida pelo Supabase. Por favor, use o link enviado ao seu e-mail.',
    };
  });
