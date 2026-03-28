import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { supabaseServer } from '../../../lib/supabase';

export const loginProcedure = publicProcedure
  .input(z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
    device: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log('🔐 Login attempt (Supabase):', input.email);

    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.session || !data.user) {
      console.log('❌ Supabase login error:', error?.message);
      throw new Error('E-mail ou senha incorretos');
    }

    console.log('✅ Login successful (Supabase):', data.user.id);

    return {
      success: true,
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: Math.max(60, Math.floor(((data.session.expires_at ?? 0) - Math.floor(Date.now()/1000)))),
        user: {
          id: data.user.id,
          name: (data.user.user_metadata as any)?.full_name ?? data.user.email ?? 'User',
          email: data.user.email ?? '',
          phone: (data.user.user_metadata as any)?.phone ?? '',
          kyc_status: 'pending',
          email_verified: !!data.user.email_confirmed_at,
        },
      },
    };
  });
