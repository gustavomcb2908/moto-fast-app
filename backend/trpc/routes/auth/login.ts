import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { db } from '../../../lib/db';
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpirationDate,
  getAccessTokenExpiresIn,
} from '../../../lib/auth';

export const loginProcedure = publicProcedure
  .input(z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
    device: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log('🔐 Login attempt:', input.email);

    const user = await db.getUserByEmail(input.email);
    if (!user) {
      console.log('❌ User not found:', input.email);
      throw new Error('E-mail ou senha incorretos');
    }

    const isPasswordValid = await comparePassword(input.password, user.password_hash);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', input.email);
      throw new Error('E-mail ou senha incorretos');
    }

    if (!user.email_verified) {
      console.log('⚠️ Email not verified:', input.email);
      throw new Error('Por favor, verifique o seu e-mail antes de fazer login');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    const refreshTokenHash = hashToken(refreshToken);

    await db.createRefreshToken({
      id: 'rt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      token_hash: refreshTokenHash,
      expires_at: getRefreshTokenExpirationDate(),
      device: input.device,
      created_at: new Date().toISOString(),
    });

    await db.updateUser(user.id, {
      last_login_at: new Date().toISOString(),
    });

    console.log('✅ Login successful:', user.id);

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: getAccessTokenExpiresIn(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          kyc_status: user.kyc_status,
          email_verified: user.email_verified,
        },
      },
    };
  });
