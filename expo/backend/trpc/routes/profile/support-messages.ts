import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { verifyAccessToken } from "../../../lib/auth";

export const getSupportMessagesProcedure = publicProcedure.query(async ({ ctx }) => {
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

  console.log(`💬 Fetching support messages for user ${userId}`);

  try {
    const messages = [
      {
        id: "1",
        text: "Olá! Como posso ajudá-lo hoje?",
        sender: "support",
        timestamp: new Date().toISOString(),
      },
    ];

    return {
      success: true,
      data: messages,
    };
  } catch (error: any) {
    console.error("❌ Error fetching support messages:", error);
    throw new Error(error.message || "Erro ao buscar mensagens");
  }
});

export const sendSupportMessageProcedure = publicProcedure
  .input(
    z.object({
      text: z.string().min(1).max(500),
    })
  )
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

    console.log(`💬 Sending support message from user ${userId}:`, input.text);

    try {
      const newMessage = {
        id: Date.now().toString(),
        text: input.text,
        sender: "user",
        timestamp: new Date().toISOString(),
      };

      console.log('✅ Message sent successfully');

      return {
        success: true,
        message: "Mensagem enviada com sucesso",
        data: newMessage,
      };
    } catch (error: any) {
      console.error("❌ Error sending message:", error);
      throw new Error(error.message || "Erro ao enviar mensagem");
    }
  });
