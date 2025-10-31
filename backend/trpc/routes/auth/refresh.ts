import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { db } from '../../../lib/db';
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpirationDate,
  getAccessTokenExpiresIn,
} from '../../../lib/auth';

export const refreshProcedure = publicProcedure
  .input(z.object({
    refreshToken: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('🔄 Token refresh request');

    const payload = verifyRefreshToken(input.refreshToken);
    if (!payload) {
      console.log('❌ Invalid refresh token');
      throw new Error('Token inválido ou expirado');
    }

    const tokenHash = hashToken(input.refreshToken);
    const storedToken = await db.getRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      console.log('❌ Refresh token not found in DB');
      throw new Error('Token inválido ou revogado');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      console.log('❌ Refresh token expired');
      throw new Error('Token expirado. Por favor, faça login novamente.');
    }

    const user = await db.getUserById(payload.userId);
    if (!user) {
      console.log('❌ User not found for token');
      throw new Error('Utilizador não encontrado');
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    const newTokenHash = hashToken(newRefreshToken);

    await db.revokeRefreshToken(tokenHash);

    await db.createRefreshToken({
      id: 'rt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      token_hash: newTokenHash,
      expires_at: getRefreshTokenExpirationDate(),
      device: storedToken.device,
      created_at: new Date().toISOString(),
    });

    console.log('✅ Tokens refreshed successfully:', user.id);

    return {
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: getAccessTokenExpiresIn(),
      },
    };
  });
