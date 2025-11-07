import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { supabaseServer } from '../../../lib/supabase';

export const registerProcedure = publicProcedure
  .input(z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    phone: z.string().min(9, 'Telefone inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    vehicleId: z.string().optional(),
    accept_terms: z.boolean().refine(val => val === true, 'Deve aceitar os termos'),
  }))
  .mutation(async ({ input }) => {
    const inputSize = Buffer.byteLength(JSON.stringify(input), 'utf8');
    console.log('📝 Registration request (Supabase):', { email: input.email, name: input.name, inputSize });

    const emailRedirectTo = process.env.EXPO_PUBLIC_FRONTEND_URL
      ? `${process.env.EXPO_PUBLIC_FRONTEND_URL}/verify-email?email=${encodeURIComponent(input.email)}`
      : undefined;

    const { data, error } = await supabaseServer.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.name,
          phone: input.phone,
          accept_terms: input.accept_terms,
          ...(input.vehicleId ? { vehicleId: input.vehicleId } : {}),
        },
        emailRedirectTo,
      },
    });

    if (error) {
      console.error('❌ Supabase signUp error:', error.message);
      throw new Error(/already exists/i.test(error.message) ? 'Este e-mail já está registado' : error.message);
    }

    console.log('✅ User registered (Supabase):', data.user?.id);

    return {
      success: true,
      message: 'Conta criada. Verifique seu e-mail para confirmar.',
      userId: data.user?.id ?? null,
    };
  });
