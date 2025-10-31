import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { db } from '../../../lib/db';
import { hashToken } from '../../../lib/auth';

export const verifyEmailProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    token: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('📧 Email verification attempt:', input.email);

    const user = await db.getUserByEmail(input.email);
    if (!user) {
      console.log('❌ User not found:', input.email);
      throw new Error('Utilizador não encontrado');
    }

    if (user.email_verified) {
      console.log('⚠️ Email already verified:', input.email);
      return {
        success: true,
        message: 'E-mail já verificado',
      };
    }

    const tokenHash = hashToken(input.token);
    const otToken = await db.getOneTimeToken(tokenHash, 'verify');

    if (!otToken) {
      console.log('❌ Invalid or expired token:', input.email);
      throw new Error('Token inválido ou expirado. Por favor, solicite um novo link de verificação.');
    }

    if (otToken.user_id !== user.id) {
      console.log('❌ Token user mismatch');
      throw new Error('Token inválido');
    }

    await db.updateUser(user.id, {
      email_verified: true,
    });

    await db.markOneTimeTokenUsed(tokenHash);

    console.log('✅ Email verified successfully:', user.id);

    return {
      success: true,
      message: 'E-mail verificado com sucesso!',
    };
  });
