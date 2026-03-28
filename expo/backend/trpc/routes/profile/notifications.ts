import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { verifyAccessToken } from "../../../lib/auth";

export const getNotificationsProcedure = publicProcedure.query(async ({ ctx }) => {
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

  console.log(`🔔 Fetching notifications for user ${userId}`);

  try {
    const notifications = [
      {
        id: "1",
        type: "delivery",
        title: "Nova Entrega Disponível",
        description: "Uma nova entrega foi atribuída a você em Luanda, Talatona.",
        timestamp: new Date().toISOString(),
        read: false,
      },
    ];

    return {
      success: true,
      data: notifications,
    };
  } catch (error: any) {
    console.error("❌ Error fetching notifications:", error);
    throw new Error(error.message || "Erro ao buscar notificações");
  }
});

export const markNotificationReadProcedure = publicProcedure
  .input(z.object({ notificationId: z.string() }))
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

    console.log(`✅ Marking notification ${input.notificationId} as read for user ${userId}`);

    return {
      success: true,
      message: "Notificação marcada como lida",
    };
  });
