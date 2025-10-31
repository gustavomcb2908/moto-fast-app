import { publicProcedure } from '../../create-context';
import { z } from 'zod';

export const listInvoicesProcedure = publicProcedure
  .input(z.object({ courierId: z.string().optional() }).optional())
  .query(async () => {
    const invoices = [
      { id: 'inv_001', amount: 150, dueDate: new Date(Date.now()+7*86400000).toISOString(), status: 'pending' },
      { id: 'inv_000', amount: 150, dueDate: new Date(Date.now()-23*86400000).toISOString(), status: 'paid' },
    ];
    return { success: true, data: invoices } as const;
  });
