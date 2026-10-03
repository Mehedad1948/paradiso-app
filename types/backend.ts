import type { paths } from "./generated/backend";

/** JSON body defined for an exact backend path and HTTP method. */
export type BackendRequestBody<
  Path extends keyof paths,
  Method extends keyof paths[Path],
> = paths[Path][Method] extends {
  requestBody: { content: { "application/json": infer Body } };
}
  ? Body
  : never;
