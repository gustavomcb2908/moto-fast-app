import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { db } from '../../../lib/db';
import {
  generateRandomToken,
  hashToken,
  getTokenExpirationDate,
} from '../../../lib/auth';
import { sendVerificationEmail } from '../../../lib/email';

export const resendVerificationProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
  }))
  .mutation(async ({ input }) => {
    console.log('📧 Resend verification request:', input.email);

    const user = await db.getUserByEmail(input.email);
    
    if (!user) {
      return {
        success: true,
        message: 'Se existe uma conta com esse e-mail, enviámos um link de verificação.',
      };
    }

    if (user.email_verified) {
      console.log('⚠️ Email already verified:', input.email);
      return {
        success: true,
        message: 'E-mail já verificado',
      };
    }

    const verifyToken = generateRandomToken();
    const tokenHash = hashToken(verifyToken);

    await db.createOneTimeToken({
      id: 'ot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      token_hash: tokenHash,
      type: 'verify',
      expires_at: getTokenExpirationDate(24),
      created_at: new Date().toISOString(),
    });

    await sendVerificationEmail(user.email, user.name, verifyToken);

    console.log('✅ Verification email resent:', user.id);

    return {
      success: true,
      message: 'Link de verificação enviado com sucesso!',
    };
  });
