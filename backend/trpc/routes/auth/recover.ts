import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { db } from '../../../lib/db';
import {
  generateRandomToken,
  hashToken,
  getTokenExpirationDate,
} from '../../../lib/auth';
import { sendPasswordResetEmail } from '../../../lib/email';

export const recoverProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
  }))
  .mutation(async ({ input }) => {
    console.log('🔑 Password recovery request:', input.email);

    const user = await db.getUserByEmail(input.email);
    
    if (user) {
      const resetToken = generateRandomToken();
      const tokenHash = hashToken(resetToken);

      await db.createOneTimeToken({
        id: 'ot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        user_id: user.id,
        token_hash: tokenHash,
        type: 'reset',
        expires_at: getTokenExpirationDate(2),
        created_at: new Date().toISOString(),
      });

      await sendPasswordResetEmail(user.email, user.name, resetToken);

      console.log('✅ Password reset email sent:', user.id);
    } else {
      console.log('⚠️ Password reset requested for non-existent user:', input.email);
    }

    return {
      success: true,
      message: 'Se existe uma conta com esse e-mail, enviámos instruções para redefinir a senha.',
    };
  });
