import { handlePanelRequest } from "@/lib/bff/panel";

type Context = { params: Promise<{ path: string[] }> };
async function handler(request: Request, context: Context) {
  const { path } = await context.params;
  return handlePanelRequest(request, path);
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
