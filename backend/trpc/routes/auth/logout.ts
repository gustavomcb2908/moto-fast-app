import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { db } from '../../../lib/db';
import { hashToken } from '../../../lib/auth';

export const logoutProcedure = publicProcedure
  .input(z.object({
    refreshToken: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('🚪 Logout request');

    const tokenHash = hashToken(input.refreshToken);
    await db.revokeRefreshToken(tokenHash);

    console.log('✅ Logout successful');

    return {
      success: true,
      message: 'Logout efetuado com sucesso',
    };
  });
