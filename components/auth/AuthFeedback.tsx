export default function AuthFeedback({
  error,
  message,
}: {
  error?: string | null;
  message?: string | null;
}) {
  return (
    <>
      {error && (
        <p role="alert" className="text-base text-danger-500">
          {error}
        </p>
      )}
      {!error && message && (
        <p role="status" className="text-base text-foreground-600">
          {message}
        </p>
      )}
    </>
  );
}
