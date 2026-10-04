import type { paths } from "./generated/backend";

export type BackendPath = keyof paths;
export type BackendMethod<Path extends BackendPath> = {
  [Method in keyof paths[Path]]: paths[Path][Method] extends {
    responses: unknown;
  }
    ? Method
    : never;
}[keyof paths[Path]];

type Operation<
  Path extends BackendPath,
  Method extends BackendMethod<Path>,
> = NonNullable<paths[Path][Method]>;

/** Types for the wire contract of an exact backend operation. */
export type BackendRequestBody<
  Path extends BackendPath,
  Method extends BackendMethod<Path>,
> = Operation<Path, Method> extends {
  requestBody: { content: { "application/json": infer Body } };
}
  ? Body
  : never;

export type BackendQuery<
  Path extends BackendPath,
  Method extends BackendMethod<Path>,
> = Operation<Path, Method> extends { parameters: { query?: infer Query } }
  ? NonNullable<Query>
  : never;

export type BackendPathParams<
  Path extends BackendPath,
  Method extends BackendMethod<Path>,
> = Operation<Path, Method> extends { parameters: { path: infer Params } }
  ? Params
  : never;

type Success<Responses> = Responses extends object
  ? Responses[Extract<keyof Responses, number>]
  : never;

export type BackendResponse<
  Path extends BackendPath,
  Method extends BackendMethod<Path>,
> = Operation<Path, Method> extends { responses: infer Responses }
  ? Success<Responses> extends {
      content: { "application/json": infer Body };
    }
    ? Body
    : never
  : never;
