type KnownError = {
  message?: string;
};

export function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    return (err as KnownError).message ?? "An unexpected error occurred.";
  }
  return "An unexpected error occurred.";
}
