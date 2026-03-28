import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { supabaseServer } from "../../../lib/supabase";

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
    const { data, error } = await supabaseServer.auth.getUser(token);
    if (error || !data.user) {
      throw new Error('Token inválido ou expirado');
    }

    const userId = data.user.id;

    console.log(`📝 Updating profile for user ${userId}:`, input);

    try {
      const updates: Record<string, unknown> = {};
      if (input.name) updates.full_name = input.name;
      if (input.phone) updates.phone = input.phone;
      if (input.address) updates.address = input.address;

      if (Object.keys(updates).length > 0) {
        const { error: upErr } = await supabaseServer
          .from('couriers')
          .update(updates)
          .eq('user_id', userId);
        if (upErr) throw upErr;
      }

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
