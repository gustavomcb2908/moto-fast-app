import { publicProcedure } from '../../create-context';
import { z } from 'zod';

export const createPaymentIntentProcedure = publicProcedure
  .input(z.object({ invoiceId: z.string(), amount: z.number().positive() }))
  .mutation(async ({ input }) => {
    const checkoutUrl = 'https://buy.stripe.com/test_00g4iK0Eo4Eo8wM9AA';
    return { success: true, data: { clientSecret: 'pi_mock_secret', checkoutUrl, invoiceId: input.invoiceId } } as const;
  });

export const confirmPaymentProcedure = publicProcedure
  .input(z.object({ invoiceId: z.string(), paymentId: z.string().optional() }))
  .mutation(async () => {
    return { success: true, message: 'Pagamento confirmado' } as const;
  });

export const listPaymentHistoryProcedure = publicProcedure
  .input(z.object({ courierId: z.string().optional() }).optional())
  .query(async () => {
    const payments = [
      { id: 'tx_123', amount: 150, date: new Date(Date.now()-31*86400000).toISOString(), method: 'card', status: 'succeeded' },
      { id: 'tx_124', amount: 150, date: new Date(Date.now()-62*86400000).toISOString(), method: 'card', status: 'succeeded' },
    ];
    return { success: true, data: payments } as const;
  });
