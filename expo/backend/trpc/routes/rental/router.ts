import { createTRPCRouter } from '../../create-context';
import { getSummaryProcedure } from './summary';
import { listInvoicesProcedure } from './invoices';
import { createPaymentIntentProcedure, confirmPaymentProcedure, listPaymentHistoryProcedure } from './payments';
import { uploadAttachmentProcedure } from './attachments';

const rentalRouter = createTRPCRouter({
  getSummary: getSummaryProcedure,
  listInvoices: listInvoicesProcedure,
  payments: createTRPCRouter({
    intent: createPaymentIntentProcedure,
    confirm: confirmPaymentProcedure,
    history: listPaymentHistoryProcedure,
  }),
  attachments: createTRPCRouter({
    upload: uploadAttachmentProcedure,
  }),
});

export default rentalRouter;
