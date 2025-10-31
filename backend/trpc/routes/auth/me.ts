import { publicProcedure } from '../../create-context';
import { db } from '../../../lib/db';
import { verifyAccessToken } from '../../../lib/auth';

export const meProcedure = publicProcedure
  .query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token não fornecido');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new Error('Token inválido ou expirado');
    }

    const user = await db.getUserById(payload.userId);

    if (!user) {
      throw new Error('Utilizador não encontrado');
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        kyc_status: user.kyc_status,
        email_verified: user.email_verified,
        documents: user.documents,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      },
    };
  });
