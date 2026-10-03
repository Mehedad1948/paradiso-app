import { handleAuthRequest } from "@/lib/bff/auth";
export async function POST(
  request: Request,
  context: { params: Promise<{ operation: string }> },
) {
  return handleAuthRequest(request, (await context.params).operation);
}
