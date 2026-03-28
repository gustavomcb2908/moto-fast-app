import { z } from 'zod';
import { publicProcedure } from '../../create-context';

export const logoutProcedure = publicProcedure
  .input(z.object({
    refreshToken: z.string(),
  }))
  .mutation(async () => {
    console.log('🚪 Logout request (client should call supabase.auth.signOut)');

    return {
      success: true,
      message: 'Logout efetuado com sucesso',
    };
  });
