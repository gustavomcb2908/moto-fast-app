import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { adminRouter } from "./admin/router";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
  })
);

app.onError((err, c) => {
  console.error("❌ Hono Error:", err);
  return c.json(
    {
      error: {
        message: err.message || "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
      },
    },
    500
  );
});

app.use("/api/trpc/*", async (c, next) => {
  console.log(`📨 Request: ${c.req.method} ${c.req.url}`);
  await next();
});

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.route('/api/admin', adminRouter);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
