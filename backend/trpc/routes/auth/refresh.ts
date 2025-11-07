import { z } from 'zod';
import { publicProcedure } from '../../create-context';

export const refreshProcedure = publicProcedure
  .input(z.object({
    refreshToken: z.string(),
  }))
  .mutation(async () => {
    console.log('🔄 Token refresh request (Supabase handles refresh on client)');
    return {
      success: true,
      data: {
        accessToken: null,
        refreshToken: null,
        expiresIn: 0,
      },
      message: 'O refresh de token é gerido pelo cliente Supabase. Obtenha a sessão atual via supabase.auth.getSession().',
    } as unknown as any;
  });
