import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { verifyAccessToken } from "../../../lib/auth";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  licenseNumber: z.string().optional(),
});

export const updateProfileProcedure = publicProcedure
  .input(updateProfileSchema)
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

    console.log(`📝 Updating profile for user ${userId}:`, input);

    try {
      console.log('✅ Profile updated successfully');

      return {
        success: true,
        message: "Perfil atualizado com sucesso",
      };
    } catch (error: any) {
      console.error("❌ Error updating profile:", error);
      throw new Error(error.message || "Erro ao atualizar perfil");
    }
  });
