import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { verifyAccessToken } from "../../../lib/auth";

const uploadAvatarSchema = z.object({
  imageBase64: z.string(),
  mimeType: z.string(),
});

export const uploadAvatarProcedure = publicProcedure
  .input(uploadAvatarSchema)
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

    console.log(`📸 Uploading avatar for user ${userId}`);

    try {
      const avatarUrl = `https://api.motofast.com/uploads/avatars/${userId}.jpg`;

      console.log('✅ Avatar uploaded successfully:', avatarUrl);

      return {
        success: true,
        message: "Avatar atualizado com sucesso",
        data: {
          avatarUrl,
        },
      };
    } catch (error: any) {
      console.error("❌ Error uploading avatar:", error);
      throw new Error(error.message || "Erro ao fazer upload do avatar");
    }
  });
