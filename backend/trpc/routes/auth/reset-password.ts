import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { db } from '../../../lib/db';
import {
  hashPassword,
  hashToken,
} from '../../../lib/auth';

export const resetPasswordProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    token: z.string(),
    newPassword: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  }))
  .mutation(async ({ input }) => {
    console.log('🔑 Password reset attempt:', input.email);

    const user = await db.getUserByEmail(input.email);
    if (!user) {
      console.log('❌ User not found:', input.email);
      throw new Error('Token inválido ou expirado');
    }

    const tokenHash = hashToken(input.token);
    const otToken = await db.getOneTimeToken(tokenHash, 'reset');

    if (!otToken) {
      console.log('❌ Invalid or expired reset token:', input.email);
      throw new Error('Token inválido ou expirado. Por favor, solicite um novo link de redefinição.');
    }

    if (otToken.user_id !== user.id) {
      console.log('❌ Token user mismatch');
      throw new Error('Token inválido');
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await db.updateUser(user.id, {
      password_hash: newPasswordHash,
    });

    await db.markOneTimeTokenUsed(tokenHash);

    await db.revokeAllUserRefreshTokens(user.id);

    console.log('✅ Password reset successfully:', user.id);

    return {
      success: true,
      message: 'Senha redefinida com sucesso!',
    };
  });
