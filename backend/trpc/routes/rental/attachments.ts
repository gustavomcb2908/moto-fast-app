import { publicProcedure } from '../../create-context';
import { z } from 'zod';

export const uploadAttachmentProcedure = publicProcedure
  .input(z.object({ paymentId: z.string().optional(), invoiceId: z.string().optional(), fileUri: z.string(), note: z.string().optional() }))
  .mutation(async ({ input }) => {
    const storedUrl = input.fileUri;
    return { success: true, data: { url: storedUrl } } as const;
  });
