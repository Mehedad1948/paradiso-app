import { renderAvatarOffscreen, type AvatarRenderRequest, type AvatarRenderResponse } from "./avatar-image";

// Typed locally: the project's TS lib is "dom", and pulling in "webworker" would clash with it.
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<AvatarRenderRequest>) => void) | null;
  postMessage: (message: AvatarRenderResponse) => void;
};

scope.onmessage = async ({ data }) => {
  try {
    scope.postMessage({ ok: true, blob: await renderAvatarOffscreen(data) });
  } catch (error) {
    scope.postMessage({ ok: false, message: error instanceof Error ? error.message : String(error) });
  }
};
