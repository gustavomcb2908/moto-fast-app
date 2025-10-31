import { publicProcedure } from '../../create-context';
import { z } from 'zod';

export const getSummaryProcedure = publicProcedure
  .input(z.object({ courierId: z.string().optional() }).optional())
  .query(async () => {
    const userId = 'demo';
    const data = {
      vehicle: { model: 'Honda PCX 150', plate: 'ABC-1D23', rentalStatus: 'active', monthlyFee: 150, nextPayment: new Date(Date.now()+7*86400000).toISOString() },
      balance: { pendingTotal: 150.0 },
      nextInvoice: { id: 'inv_001', amount: 150, dueDate: new Date(Date.now()+7*86400000).toISOString(), status: 'pending' },
      lastPayments: [
        { id: 'tx_123', amount: 150, date: new Date(Date.now()-31*86400000).toISOString(), status: 'succeeded' },
      ],
    } as const;
    return { success: true, data, userId } as const;
  });
