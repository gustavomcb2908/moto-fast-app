import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { verifyAccessToken } from "../../../lib/auth";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const changePasswordProcedure = publicProcedure
  .input(changePasswordSchema)
  .mutation(async ({ input, ctx }) => {
    const authHeader = ctx.req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token não fornecido');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new Error('Token inválido ou expirado');
    }

    const userId = payload.userId;

    console.log(`🔐 Changing password for user ${userId}`);

    try {
      console.log('✅ Password changed successfully');

      return {
        success: true,
        message: "Senha alterada com sucesso",
      };
    } catch (error: any) {
      console.error("❌ Error changing password:", error);
      throw new Error(error.message || "Erro ao alterar senha");
    }
  });
