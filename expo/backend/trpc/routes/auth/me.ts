import { publicProcedure } from '../../create-context';
import { supabaseServer } from '../../../lib/supabase';

export const meProcedure = publicProcedure
  .query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token não fornecido');
    }

    const token = authHeader.substring(7);
    const { data, error } = await supabaseServer.auth.getUser(token);
    if (error || !data.user) {
      throw new Error('Token inválido ou expirado');
    }

    const u = data.user;
    return {
      success: true,
      data: {
        id: u.id,
        name: (u.user_metadata as any)?.full_name ?? u.email ?? 'User',
        email: u.email ?? '',
        phone: (u.user_metadata as any)?.phone ?? '',
        kyc_status: 'pending',
        email_verified: !!u.email_confirmed_at,
        documents: {},
        created_at: u.created_at,
        last_login_at: null,
      },
    };
  });
