import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { registerProcedure } from "./routes/auth/register";
import { loginProcedure } from "./routes/auth/login";
import { verifyEmailProcedure } from "./routes/auth/verify-email";
import { resendVerificationProcedure } from "./routes/auth/resend-verification";
import { recoverProcedure } from "./routes/auth/recover";
import { resetPasswordProcedure } from "./routes/auth/reset-password";
import { refreshProcedure } from "./routes/auth/refresh";
import { logoutProcedure } from "./routes/auth/logout";
import { meProcedure } from "./routes/auth/me";
import { updateProfileProcedure } from "./routes/profile/update";
import { changePasswordProcedure } from "./routes/profile/change-password";
import { uploadAvatarProcedure } from "./routes/profile/upload-avatar";
import { getNotificationsProcedure, markNotificationReadProcedure } from "./routes/profile/notifications";
import { getSupportMessagesProcedure, sendSupportMessageProcedure } from "./routes/profile/support-messages";
import rentalRouter from './routes/rental/router';
import traccarRouter from './routes/traccar/router';

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    register: registerProcedure,
    login: loginProcedure,
    verifyEmail: verifyEmailProcedure,
    resendVerification: resendVerificationProcedure,
    recover: recoverProcedure,
    resetPassword: resetPasswordProcedure,
    refresh: refreshProcedure,
    logout: logoutProcedure,
    me: meProcedure,
  }),
  profile: createTRPCRouter({
    update: updateProfileProcedure,
    changePassword: changePasswordProcedure,
    uploadAvatar: uploadAvatarProcedure,
    getNotifications: getNotificationsProcedure,
    markNotificationRead: markNotificationReadProcedure,
    getSupportMessages: getSupportMessagesProcedure,
    sendSupportMessage: sendSupportMessageProcedure,
  }),
  rental: rentalRouter,
  traccar: traccarRouter,
});

export type AppRouter = typeof appRouter;
