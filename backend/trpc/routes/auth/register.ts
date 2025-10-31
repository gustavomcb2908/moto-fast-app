import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { db } from '../../../lib/db';
import { 
  hashPassword, 
  generateRandomToken, 
  hashToken, 
  getTokenExpirationDate 
} from '../../../lib/auth';
import { sendVerificationEmail } from '../../../lib/email';

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
    console.log('📝 Registration request:', { email: input.email, name: input.name, inputSize });

    const existingUser = await db.getUserByEmail(input.email);
    if (existingUser) {
      console.log('❌ User already exists:', input.email);
      throw new Error('Este e-mail já está registado');
    }

    const userId = 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const passwordHash = await hashPassword(input.password);

    const newUser = await db.createUser({
      id: userId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      password_hash: passwordHash,
      email_verified: false,
      kyc_status: 'pending',
      documents: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const verifyToken = generateRandomToken();
    const tokenHash = hashToken(verifyToken);

    await db.createOneTimeToken({
      id: 'ot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      user_id: newUser.id,
      token_hash: tokenHash,
      type: 'verify',
      expires_at: getTokenExpirationDate(24),
      created_at: new Date().toISOString(),
    });

    const emailResult = await sendVerificationEmail(newUser.email, newUser.name, verifyToken);
    
    console.log('✅ User registered successfully:', newUser.id);
    if (!emailResult.success) {
      console.warn('⚠️ Failed to send verification email');
    }

    return {
      success: true,
      message: 'Conta criada com sucesso! Por favor, verifique o seu e-mail.',
      userId: newUser.id,
    };
  });
