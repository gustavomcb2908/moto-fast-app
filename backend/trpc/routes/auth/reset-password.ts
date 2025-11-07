import { z } from 'zod';
import { publicProcedure } from '../../create-context';

export const resetPasswordProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    token: z.string(),
    newPassword: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  }))
  .mutation(async () => {
    console.log('🔑 Password reset attempt via API: handled by Supabase magic link');
    return {
      success: true,
      message: 'A redefinição de senha é concluída pelo link do Supabase. Abra o link recebido no e-mail e defina a nova senha.',
    };
  });
