export const runtime = 'edge';

async function getApp() {
  const mod = await import('@/backend/hono');
  return mod.default;
}

export async function GET(request: Request) {
  const app = await getApp();
  return app.fetch(request);
}

export async function POST(request: Request) {
  const app = await getApp();
  return app.fetch(request);
}

export async function PUT(request: Request) {
  const app = await getApp();
  return app.fetch(request);
}

export async function DELETE(request: Request) {
  const app = await getApp();
  return app.fetch(request);
}

export async function OPTIONS(request: Request) {
  const app = await getApp();
  return app.fetch(request);
}

export async function PATCH(request: Request) {
  const app = await getApp();
  return app.fetch(request);
}
