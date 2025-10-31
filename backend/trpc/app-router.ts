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
});

export type AppRouter = typeof appRouter;
